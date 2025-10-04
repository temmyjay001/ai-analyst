// lib/analytics/chat-analytics.ts

import { db } from "@/lib/db";
import { chatMessages, chatSessions } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";

/**
 * Track streaming performance metrics
 */
export async function trackStreamingMetrics(data: {
  sessionId: string;
  totalTimeMs: number;
  sqlGenerationTimeMs: number;
  queryExecutionTimeMs: number;
  interpretationTimeMs: number;
  fromCache: boolean;
}) {
  // In production, send to analytics service (e.g., PostHog, Mixpanel)
  console.log("Streaming Metrics:", data);

  // Could store in a separate metrics table for analysis
}

/**
 * Get user's chat statistics
 */
export async function getUserChatStats(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Total sessions
  const totalSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId));

  // Total messages
  const totalMessages = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatMessages)
    .innerJoin(chatSessions, eq(chatMessages.sessionId, chatSessions.id))
    .where(eq(chatSessions.userId, userId));

  // Sessions in last 30 days
  const recentSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatSessions)
    .where(
      and(
        eq(chatSessions.userId, userId),
        gte(chatSessions.createdAt, thirtyDaysAgo)
      )
    );

  return {
    totalSessions: Number(totalSessions[0].count),
    totalMessages: Number(totalMessages[0].count),
    recentSessions: Number(recentSessions[0].count),
  };
}
