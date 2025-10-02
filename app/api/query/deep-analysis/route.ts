// app/api/query/deep-analysis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import {
  users,
  databaseConnections,
  queries,
  usageTracking,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { executeDeepAnalysis, canRunDeepAnalysis } from "@/lib/ai/deepAnalysis";
import { getSchemaContext } from "@/lib/database/schemaIntrospection";
import { ConnectionConfig } from "@/lib/database/factory";

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

    const { question, sql, results, connectionId } = await req.json();

    if (!question || !sql || !results || !connectionId) {
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

    // Check if plan allows deep analysis (Growth+ only)
    if (userPlan === "free" || userPlan === "starter") {
      return NextResponse.json(
        {
          success: false,
          error: "Deep Analysis requires Growth plan or higher",
          upgradeRequired: true,
          requiredPlan: "growth",
        },
        { status: 403 }
      );
    }

    // Check usage limits - deep analysis uses 3 additional queries
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

    const analysisCheck = canRunDeepAnalysis(currentQueryCount, limit);

    if (!analysisCheck.canRun) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient queries for deep analysis. Need ${analysisCheck.required}, have ${analysisCheck.available} remaining.`,
          queriesNeeded: analysisCheck.required,
          queriesAvailable: analysisCheck.available,
        },
        { status: 429 }
      );
    }

    // Get database connection
    const connection = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.id, connectionId))
      .limit(1);

    if (!connection || connection.length === 0) {
      return NextResponse.json(
        { success: false, error: "Database connection not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (connection[0].userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to database connection" },
        { status: 403 }
      );
    }

    const dbType = connection[0].type;

    const connectionConfig = connection[0] as ConnectionConfig;

    // Get schema context
    const schemaContext = await getSchemaContext(connectionConfig);

    // Execute deep analysis
    const analysisResult = await executeDeepAnalysis(
      question,
      sql,
      results,
      connectionConfig,
      schemaContext.formatted,
      dbType,
      userPlan
    );

    // Update usage tracking - add 3 queries for follow-ups
    const newQueryCount = currentQueryCount + 3;
    if (usage[0]) {
      await db
        .update(usageTracking)
        .set({ queryCount: newQueryCount })
        .where(eq(usageTracking.id, usage[0].id));
    } else {
      await db.insert(usageTracking).values({
        userId,
        date: today,
        queryCount: 3,
      });
    }

    // Save deep analysis to query history
    await db.insert(queries).values({
      userId,
      connectionId,
      question: `[Deep Analysis] ${question}`,
      sqlGenerated: sql,
      results: JSON.stringify({
        original: analysisResult.originalResults.slice(0, 100),
        followUps: analysisResult.followUpSteps.map((step) => ({
          question: step.question,
          results: step.results.slice(0, 50),
        })),
      }),
      interpretation: analysisResult.comprehensiveInsights,
      executionTimeMs: analysisResult.executionTimeMs,
      rowCount: analysisResult.originalResults.length,
    });

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      queriesUsed: 3,
      totalExecutionTime: totalTime,
    });
  } catch (error: any) {
    console.error("Deep analysis error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute deep analysis",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
