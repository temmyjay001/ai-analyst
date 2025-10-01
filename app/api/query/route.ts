// app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import {
  users,
  databaseConnections,
  queries,
  usageTracking,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { executeQuery, DatabaseType } from "@/lib/database/factory";
import { getSchemaContext } from "@/lib/database/schemaIntrospection";

// Schema cache
const schemaCache = new Map<
  string,
  { formatted: string; timestamp: number; dbType: DatabaseType }
>();
const SCHEMA_CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Query limits per plan
const PLAN_LIMITS = {
  free: 3,
  starter: 50,
  growth: 300,
  enterprise: Infinity,
};

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { question, connectionId } = await req.json();

    if (!question || !connectionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user info
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
    const limit =
      PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

    if (currentQueryCount >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily query limit reached (${limit} queries). Please upgrade your plan.`,
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

    const dbConfig = connection[0];
    const dbType = dbConfig.type as DatabaseType;

    // Schema caching with database type awareness
    let schemaInfo: string;
    const cachedSchema = schemaCache.get(connectionId);

    if (
      cachedSchema &&
      Date.now() - cachedSchema.timestamp < SCHEMA_CACHE_TTL &&
      cachedSchema.dbType === dbType
    ) {
      console.log(
        `✅ Using cached schema for connection: ${connectionId} (${dbType})`
      );
      schemaInfo = cachedSchema.formatted;
    } else {
      console.log(
        `🔄 Fetching fresh schema for connection: ${connectionId} (${dbType})`
      );

      try {
        const schemaContext = await getSchemaContext({
          id: dbConfig.id,
          type: dbType,
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          passwordEncrypted: dbConfig.passwordEncrypted,
          connectionUrlEncrypted: dbConfig.connectionUrlEncrypted,
          ssl: dbConfig.ssl,
        });

        schemaInfo = schemaContext.formatted;

        schemaCache.set(connectionId, {
          formatted: schemaInfo,
          timestamp: Date.now(),
          dbType: dbType,
        });
      } catch (schemaError: any) {
        console.error("Schema introspection error:", schemaError);
        return NextResponse.json(
          {
            success: false,
            error: `Failed to read database schema: ${schemaError.message}`,
          },
          { status: 500 }
        );
      }
    }

    // Generate SQL using AI with context caching (75% cost reduction!)
    const { generateSQL } = await import("@/lib/ai/gemini-multidb");

    let sql: string;
    try {
      const result = await generateSQL(
        question,
        schemaInfo,
        userPlan,
        dbType,
        connectionId
      );
      sql = result.sql;
    } catch (aiError: any) {
      console.error("AI SQL generation error:", aiError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate SQL: ${aiError.message}`,
        },
        { status: 500 }
      );
    }

    // Execute SQL using the database factory
    let results: any[] = [];
    let error: string | undefined;
    let interpretation: string = "";

    try {
      const queryResult = await executeQuery(
        {
          id: dbConfig.id,
          type: dbType,
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          passwordEncrypted: dbConfig.passwordEncrypted,
          connectionUrlEncrypted: dbConfig.connectionUrlEncrypted,
          ssl: dbConfig.ssl,
        },
        sql
      );

      results = queryResult.rows;

      // Generate interpretation with smart context
      const { interpretResults } = await import("@/lib/ai/gemini-multidb");
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

      // Provide helpful error context based on database type
      let errorContext = "";
      switch (dbType) {
        case "mysql":
          errorContext = " (Check MySQL-specific syntax)";
          break;
        case "mssql":
          errorContext = " (Check SQL Server-specific syntax)";
          break;
        case "sqlite":
          errorContext = " (Check SQLite-specific syntax)";
          break;
        case "postgresql":
          errorContext = " (Check PostgreSQL-specific syntax)";
          break;
      }
      error = error + errorContext;
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
          interpretation,
          dbType,
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
      dbType,
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
