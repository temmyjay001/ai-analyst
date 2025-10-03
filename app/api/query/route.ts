// app/api/query/route.ts - CORRECTED VERSION with Sessions
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import {
  users,
  databaseConnections,
  queries,
  usageTracking,
  chatSessions,
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { executeQuery, DatabaseType } from "@/lib/database/factory";
import { getSchemaContext } from "@/lib/database/schemaIntrospection";

// Schema cache (keep existing implementation)
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

// Multi-turn chat support per plan
const MULTI_TURN_PLANS = ["growth", "enterprise"];

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

    const { question, connectionId, sessionId } = await req.json();

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
          error: `Daily query limit reached (${limit} queries). Upgrade your plan for more queries.`,
          limitReached: true,
        },
        { status: 429 }
      );
    }

    // Check if multi-turn is allowed for this plan
    const isMultiTurnAllowed = MULTI_TURN_PLANS.includes(userPlan);

    // Handle session creation or validation
    let currentSessionId = sessionId;
    let currentSession;

    if (sessionId) {
      // Validate existing session
      currentSession = await db
        .select()
        .from(chatSessions)
        .where(
          and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId))
        )
        .limit(1);

      if (!currentSession[0]) {
        return NextResponse.json(
          { success: false, error: "Session not found" },
          { status: 404 }
        );
      }

      // Check if user plan allows multi-turn
      if (!isMultiTurnAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Multi-turn conversations require Growth plan or higher",
            upgradeRequired: true,
          },
          { status: 403 }
        );
      }

      currentSessionId = sessionId;
    } else {
      // Create new session
      const title =
        question.length > 50 ? question.substring(0, 50) + "..." : question;

      const newSession = await db
        .insert(chatSessions)
        .values({
          userId,
          connectionId,
          title,
          plan: userPlan,
          isMultiTurn: isMultiTurnAllowed,
          messageCount: 0,
        })
        .returning();

      currentSessionId = newSession[0].id;
      currentSession = newSession;
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

    // Schema caching with database type awareness (existing logic)
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

    // Get conversation history if multi-turn
    let conversationContext = "";
    if (sessionId && isMultiTurnAllowed) {
      const previousMessages = await db
        .select()
        .from(queries)
        .where(eq(queries.sessionId, sessionId))
        .orderBy(desc(queries.messageIndex))
        .limit(5); // Last 5 messages for context

      if (previousMessages.length > 0) {
        conversationContext = previousMessages
          .reverse()
          .map((msg) => {
            if (msg.role === "user") {
              return `User: ${msg.question}`;
            } else {
              return `Assistant: ${
                msg.interpretation || "Query executed successfully"
              }`;
            }
          })
          .join("\n");
      }
    }

    // Get current message index
    const messageIndex = currentSession[0]?.messageCount || 0;

    // Insert user message
    await db.insert(queries).values({
      userId,
      connectionId,
      sessionId: currentSessionId,
      role: "user",
      messageIndex,
      question,
    });

    // Generate SQL using gemini-multidb.ts (with context caching)
    const { generateSQL } = await import("@/lib/ai/gemini-multidb");

    let sql: string;
    try {
      const result = await generateSQL(
        question,
        conversationContext
          ? `${schemaInfo}\n\nPrevious conversation:\n${conversationContext}`
          : schemaInfo,
        userPlan,
        dbType,
        connectionId // This enables context caching!
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

    // Insert assistant message
    const assistantMessage = await db
      .insert(queries)
      .values({
        userId,
        connectionId,
        sessionId: currentSessionId,
        role: "assistant",
        messageIndex: messageIndex + 1,
        sqlGenerated: sql,
        results: results.length > 0 ? results : null,
        interpretation,
        executionTimeMs: executionTime,
        rowCount: results.length,
        error,
      })
      .returning();

    // Update session message count
    await db
      .update(chatSessions)
      .set({
        messageCount: messageIndex + 2,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, currentSessionId));

    // Update usage tracking
    if (usage[0]) {
      await db
        .update(usageTracking)
        .set({ queryCount: currentQueryCount + 1 })
        .where(eq(usageTracking.id, usage[0].id));
    } else {
      await db.insert(usageTracking).values({
        userId,
        date: today,
        queryCount: 1,
      });
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          sessionId: currentSessionId,
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
      sessionId: currentSessionId,
      message: assistantMessage[0],
      sql,
      results,
      rowCount: results.length,
      executionTime,
      interpretation,
      dbType,
      canContinue: isMultiTurnAllowed,
      usageRemaining: limit - currentQueryCount - 1,
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
