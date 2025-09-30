// app/api/query/route.ts - FIXED decryption + caching
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import {
  users,
  databaseConnections,
  usageTracking,
  queries,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { Client } from "pg";
import { decrypt } from "@/lib/encryption";
import { authOptions } from "../auth/[...nextauth]/route";

// Schema cache (in-memory)
const schemaCache = new Map<string, { formatted: string; timestamp: number }>();
const SCHEMA_CACHE_TTL = 3600000; // 1 hour

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { question, connectionId } = await request.json();

    if (!question || !connectionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userId = user[0].id;
    const userPlan = user[0].plan || "free";

    // Check usage limits
    const today = new Date().toISOString().split("T")[0];
    const usage = await db
      .select()
      .from(usageTracking)
      .where(
        and(eq(usageTracking.userId, userId), eq(usageTracking.date, today))
      )
      .limit(1);

    const currentQueryCount = usage[0]?.queryCount || 0;

    // UPDATED LIMITS - More restrictive free tier
    const QUERY_LIMITS: Record<string, number> = {
      free: 3, // Reduced from 10 to 3
      starter: 50,
      growth: 300,
      enterprise: 1500,
    };

    const limit = QUERY_LIMITS[userPlan] || QUERY_LIMITS.free;

    if (currentQueryCount >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily query limit reached (${limit} queries/day). Please upgrade your plan.`,
          limit,
          used: currentQueryCount,
        },
        { status: 429 }
      );
    }

    // Get database connection
    const connection = await db
      .select()
      .from(databaseConnections)
      .where(
        and(
          eq(databaseConnections.id, connectionId),
          eq(databaseConnections.userId, userId)
        )
      )
      .limit(1);

    if (!connection || connection.length === 0) {
      return NextResponse.json(
        { success: false, error: "Database connection not found" },
        { status: 404 }
      );
    }

    // FIXED: Proper decryption logic
    let connectionString: string;

    if (connection[0].connectionUrlEncrypted) {
      // If connection URL was stored, decrypt it
      connectionString = decrypt(connection[0].connectionUrlEncrypted);
    } else {
      // Otherwise, build connection string from individual fields
      if (!connection[0].passwordEncrypted) {
        return NextResponse.json(
          { success: false, error: "Invalid connection configuration" },
          { status: 400 }
        );
      }

      const password = decrypt(connection[0].passwordEncrypted);
      const sslParam = connection[0].ssl ? "?sslmode=require" : "";

      connectionString = `postgresql://${
        connection[0].username
      }:${encodeURIComponent(password)}@${connection[0].host}:${
        connection[0].port
      }/${connection[0].database}${sslParam}`;
    }

    // Schema caching
    let schemaInfo: string;
    const cachedSchema = schemaCache.get(connectionId);

    if (
      cachedSchema &&
      Date.now() - cachedSchema.timestamp < SCHEMA_CACHE_TTL
    ) {
      console.log(`✅ Using cached schema for connection: ${connectionId}`);
      schemaInfo = cachedSchema.formatted;
    } else {
      console.log(`🔄 Fetching fresh schema for connection: ${connectionId}`);
      const { getSchemaContext } = await import("@/lib/schemaIntrospection");
      const schemaContext = await getSchemaContext(connectionString);
      schemaInfo = schemaContext.formatted;

      schemaCache.set(connectionId, {
        formatted: schemaInfo,
        timestamp: Date.now(),
      });
    }

    // Generate SQL using AI with context caching (75% cost reduction!)
    const { generateSQL } = await import("@/lib/ai/gemini");
    const { sql } = await generateSQL(
      question,
      schemaInfo,
      userPlan,
      connectionId
    );

    // Execute SQL
    const client = new Client({
      connectionString,
      connectionTimeoutMillis: 10000,
    });

    let results: any[] = [];
    let error: string | undefined;
    let interpretation: string = "";

    try {
      await client.connect();
      const queryResult = await client.query(sql);
      results = queryResult.rows;
      await client.end();

      // Generate interpretation with smart context
      const { interpretResults } = await import("@/lib/ai/gemini");
      interpretation = await interpretResults(
        question,
        sql,
        results,
        results.length,
        userPlan
      );
    } catch (err: any) {
      error = err.message;
      interpretation = `Error executing query: ${err.message}`;
      await client.end().catch(() => {});
    }

    const executionTime = Date.now() - startTime;

    // Save query to history
    await db.insert(queries).values({
      userId: user[0].id,
      connectionId,
      question,
      sqlGenerated: sql,
      results: results.length > 0 ? results : null,
      interpretation,
      executionTimeMs: executionTime,
      rowCount: results.length,
      error,
    });

    // Update usage tracking
    if (usage[0]) {
      await db
        .update(usageTracking)
        .set({ queryCount: (usage[0].queryCount as number) + 1 })
        .where(eq(usageTracking.id, usage[0].id));
    } else {
      await db.insert(usageTracking).values({
        userId: user[0].id,
        date: today,
        queryCount: 1,
      });
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error,
          sql,
          interpretation: "There was an error executing your query.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sql,
      results,
      rowCount: results.length,
      executionTime,
      interpretation,
    });
  } catch (error: any) {
    console.error("Query error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process query",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
