// app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import {
  databaseConnections,
  users,
  queries,
  usageTracking,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { Client } from "pg";
import { generateSQL } from "@/lib/ai/gemini";
import { schemaCache } from "@/lib/schemaCache";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check usage limits
    const today = new Date().toISOString().split("T")[0];
    const usage = await db
      .select()
      .from(usageTracking)
      .where(
        and(eq(usageTracking.userId, user[0].id), eq(usageTracking.date, today))
      )
      .limit(1);

    const queryCount = usage[0]?.queryCount || 0;
    const userPlan = user[0].plan || "free";

    // Define limits per plan
    const limits: Record<string, number> = {
      free: 10,
      starter: 100,
      growth: 500,
      enterprise: 999999,
    };

    if (queryCount >= limits[userPlan]) {
      return NextResponse.json(
        {
          message: `Daily query limit reached (${limits[userPlan]} queries). Please upgrade your plan.`,
          error: "LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    const { connectionId, question } = await req.json();

    if (!connectionId || !question) {
      return NextResponse.json(
        { message: "Connection ID and question are required" },
        { status: 400 }
      );
    }

    // Get connection details
    const connection = await db
      .select()
      .from(databaseConnections)
      .where(
        and(
          eq(databaseConnections.id, connectionId),
          eq(databaseConnections.userId, user[0].id)
        )
      )
      .limit(1);

    if (!connection[0]) {
      return NextResponse.json(
        { message: "Connection not found" },
        { status: 404 }
      );
    }

    // Get connection string
    let connectionString: string;
    if (connection[0].connectionUrlEncrypted) {
      connectionString = decrypt(connection[0].connectionUrlEncrypted);
    } else {
      const password = decrypt(connection[0].passwordEncrypted!);
      const sslParam = connection[0].ssl ? "?sslmode=require" : "";
      connectionString = `postgresql://${
        connection[0].username
      }:${encodeURIComponent(password)}@${connection[0].host}:${
        connection[0].port
      }/${connection[0].database}${sslParam}`;
    }

    // 🚀 SCHEMA CACHING: Check cache first
    let schemaInfo: string;
    const cachedSchema = schemaCache.get(connectionId);

    if (cachedSchema) {
      console.log(`✅ Using cached schema for connection: ${connectionId}`);
      schemaInfo = cachedSchema.formatted;
    } else {
      console.log(`🔄 Fetching fresh schema for connection: ${connectionId}`);
      const { getSchemaContext } = await import("@/lib/schemaIntrospection");
      const schemaContext = await getSchemaContext(connectionString);
      schemaInfo = schemaContext.formatted;

      // Cache the schema
      schemaCache.set(connectionId, schemaContext);
    }

    // Generate SQL using AI (pass user plan for model selection)
    const { sql } = await generateSQL(question, schemaInfo, userPlan);

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

      // Generate interpretation AFTER getting results
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
