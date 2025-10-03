// app/api/chat/deep-analysis/stream/route.ts

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { users, chatSessions, chatMessages, usageTracking } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { executeDeepAnalysisStreaming } from "@/lib/ai/deepAnalysis-streaming";
import { authOptions } from "../../auth/[...nextauth]/route";

const PLAN_LIMITS = {
  free: 3,
  starter: 50,
  growth: 300,
  enterprise: Infinity,
};

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { question, sql, results, connectionId, sessionId } =
      await req.json();

    if (!question || !sql || !results || !connectionId || !sessionId) {
      return new Response("Missing required fields", { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Validate user
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, session.user!.email as string))
            .limit(1);

          if (!user[0]) {
            send("error", { message: "User not found" });
            controller.close();
            return;
          }

          const userId = user[0].id;
          const userPlan = user[0].plan || "free";

          // Check if plan allows deep analysis
          if (userPlan === "free" || userPlan === "starter") {
            send("error", {
              message: "Deep Analysis requires Growth plan or higher",
              upgradeRequired: true,
              requiredPlan: "growth",
            });
            controller.close();
            return;
          }

          // Verify session ownership
          const chatSession = await db
            .select()
            .from(chatSessions)
            .where(
              and(
                eq(chatSessions.id, sessionId),
                eq(chatSessions.userId, userId)
              )
            )
            .limit(1);

          if (!chatSession[0]) {
            send("error", { message: "Session not found" });
            controller.close();
            return;
          }

          // Check usage (deep analysis uses 3 queries)
          const today = new Date().toISOString().split("T")[0];
          const usage = await db
            .select()
            .from(usageTracking)
            .where(
              and(
                eq(usageTracking.userId, userId),
                eq(usageTracking.date, today)
              )
            )
            .limit(1);

          const currentQueryCount = usage[0]?.queryCount || 0;
          const limit = PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS];
          const available = limit - currentQueryCount;

          if (available < 3) {
            send("error", {
              message: `Insufficient queries for deep analysis. Need 3, have ${available} remaining.`,
              queriesNeeded: 3,
              queriesAvailable: available,
            });
            controller.close();
            return;
          }

          // Execute deep analysis with streaming
          send("status", { message: "Starting deep analysis..." });

          const deepAnalysisSteps: any[] = [];

          for await (const event of executeDeepAnalysisStreaming(
            question,
            sql,
            results,
            connectionId,
            userPlan
          )) {
            send(event.type, event.data);

            if (event.type === "step_complete") {
              deepAnalysisSteps.push(event.data);
            }
          }

          // Save deep analysis user message
          await db.insert(chatMessages).values({
            sessionId,
            role: "user",
            content: `[Deep Analysis Request] ${question}`,
          });

          // Save deep analysis results as assistant message
          const comprehensiveInsights = deepAnalysisSteps
            .map((step) => step.insights)
            .join("\n\n");

          await db.insert(chatMessages).values({
            sessionId,
            role: "assistant",
            content: comprehensiveInsights,
            metadata: {
              sql,
              results: results.slice(0, 100),
              isDeepAnalysis: true,
              deepAnalysisSteps,
            },
          });

          // Update session
          await db
            .update(chatSessions)
            .set({
              messageCount: chatSession[0].messageCount + 2,
              updatedAt: new Date(),
            })
            .where(eq(chatSessions.id, sessionId));

          // Update usage (add 3 for follow-ups)
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

          send("complete", {
            queriesUsed: 3,
            usageRemaining: limit - newQueryCount,
          });

          controller.close();
        } catch (error: any) {
          console.error("Deep analysis stream error:", error);
          send("error", { message: error.message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Deep analysis SSE route error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
