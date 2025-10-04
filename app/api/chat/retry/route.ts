// app/api/chat/retry/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { users, chatMessages, chatSessions, usageTracking } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import {
  executeQuery,
  DatabaseType,
  ConnectionConfig,
} from "@/lib/database/factory";
import { streamInterpretation } from "@/lib/ai/gemini-streaming";
import { authOptions } from "../../auth/[...nextauth]/route";

const PLAN_LIMITS = {
  free: 3,
  starter: 50,
  growth: 300,
  enterprise: Infinity,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { message: "Message ID required" },
        { status: 400 }
      );
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userId = user[0].id;
    const userPlan = user[0].plan || "free";

    // Get the failed message
    const message = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId))
      .limit(1);

    if (!message[0]) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    // Verify ownership via session
    const chatSession = await db
      .select()
      .from(chatSessions)
      .where(
        and(
          eq(chatSessions.id, message[0].sessionId),
          eq(chatSessions.userId, userId)
        )
      )
      .limit(1);

    if (!chatSession[0]) {
      return NextResponse.json(
        { message: "Unauthorized access to message" },
        { status: 403 }
      );
    }

    // Check if message can be retried
    if (!message[0].metadata?.canRetry) {
      return NextResponse.json(
        { message: "This message cannot be retried" },
        { status: 400 }
      );
    }

    const metadata = message[0].metadata;
    const sql = metadata.sql;
    const dbType = metadata.dbType as DatabaseType;

    if (!sql) {
      return NextResponse.json(
        { message: "No SQL found to retry" },
        { status: 400 }
      );
    }

    // Check usage limits (retry doesn't count against limit)
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

    // Get connection from session
    const { databaseConnections } = await import("@/lib/schema");
    const connection = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.id, chatSession[0].connectionId))
      .limit(1);

    if (!connection[0]) {
      return NextResponse.json(
        { message: "Database connection not found" },
        { status: 404 }
      );
    }

    const dbConfig = connection[0];

    // Get user question from previous user message
    const userMessages = await db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.sessionId, message[0].sessionId),
          eq(chatMessages.role, "user")
        )
      )
      .orderBy(chatMessages.createdAt);

    const lastUserMessage = userMessages[userMessages.length - 1];
    const question = lastUserMessage?.content || "Analyze the data";

    // Retry execution
    let results: any[] = [];
    let executionTime = 0;
    let error: string | null = null;

    const startTime = Date.now();
    try {
      const queryResult = await executeQuery(dbConfig as ConnectionConfig, sql);
      results = queryResult.rows;
      executionTime = Date.now() - startTime;
    } catch (err: any) {
      error = err.message;

      // Update the message with retry attempt
      await db
        .update(chatMessages)
        .set({
          metadata: {
            ...metadata,
            retryCount: (metadata.retryCount || 0) + 1,
          },
        })
        .where(eq(chatMessages.id, messageId));

      return NextResponse.json(
        {
          success: false,
          error: `Retry failed: ${error}`,
          retryCount: (metadata.retryCount || 0) + 1,
        },
        { status: 400 }
      );
    }

    // Generate interpretation
    let interpretation = "";
    for await (const chunk of streamInterpretation(
      question,
      sql,
      results,
      dbType,
      userPlan
    )) {
      interpretation += chunk;
    }

    // Create new successful message
    const newMessage = await db
      .insert(chatMessages)
      .values({
        sessionId: message[0].sessionId,
        role: "assistant",
        content: interpretation,
        metadata: {
          sql,
          results: results.slice(0, 100),
          executionTimeMs: executionTime,
          rowCount: results.length,
          dbType,
          fromCache: false,
          retryOf: messageId,
          retryCount: (metadata.retryCount || 0) + 1,
        },
      })
      .returning();

    // Mark original message as retried (can't retry again)
    await db
      .update(chatMessages)
      .set({
        metadata: {
          ...metadata,
          canRetry: false,
          retryCount: (metadata.retryCount || 0) + 1,
        },
      })
      .where(eq(chatMessages.id, messageId));

    // Update session
    await db
      .update(chatSessions)
      .set({
        messageCount: chatSession[0].messageCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, message[0].sessionId));

    return NextResponse.json({
      success: true,
      message: newMessage[0],
      retryCount: (metadata.retryCount || 0) + 1,
    });
  } catch (error: any) {
    console.error("Retry error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to retry query" },
      { status: 500 }
    );
  }
}
