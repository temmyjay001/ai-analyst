// app/api/chat/stream/route.ts - WITH REDIS CACHE

import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import {
  users,
  databaseConnections,
  chatSessions,
  chatMessages,
  usageTracking,
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  executeQuery,
  DatabaseType,
  ConnectionConfig,
} from "@/lib/database/factory";
import { getSchemaContext } from "@/lib/database/schemaIntrospection";
import { streamSQL, streamInterpretation } from "@/lib/ai/gemini-streaming";
import {
  generateCacheKey,
  getCachedResult,
  setCachedResult,
} from "@/lib/cache/redis-cache";
import { validateAndCleanSQL } from "@/lib/utils/sql";

// Plan limits
const PLAN_LIMITS = {
  free: 3,
  starter: 50,
  growth: 300,
  enterprise: Infinity,
};

const MULTI_TURN_PLANS = ["growth", "enterprise"];

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { question, connectionId, sessionId } = await req.json();

    if (!question || !connectionId) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Setup SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: any) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // ==========================================
          // 1. VALIDATE USER & CHECK LIMITS
          // ==========================================
          send("status", {
            stage: "initializing",
            message: "Validating request...",
          });

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

          // Check usage limits
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
          const limit =
            PLAN_LIMITS[userPlan as keyof typeof PLAN_LIMITS] ||
            PLAN_LIMITS.free;

          if (currentQueryCount >= limit) {
            send("error", {
              message: `Daily query limit reached (${limit} queries)`,
              limitReached: true,
              currentUsage: currentQueryCount,
              limit,
            });
            controller.close();
            return;
          }

          // Check multi-turn permission
          const isMultiTurnAllowed = MULTI_TURN_PLANS.includes(userPlan);

          // ==========================================
          // 2. CHECK REDIS CACHE FIRST
          // ==========================================
          const cacheKey = generateCacheKey(question, connectionId);
          let cachedResult = null;

          try {
            cachedResult = await getCachedResult(cacheKey);
          } catch (error) {
            console.error(
              "Cache lookup failed, proceeding without cache:",
              error
            );
          }

          if (cachedResult) {
            send("status", {
              stage: "complete",
              message: "Loading from cache...",
            });

            // Handle session creation if needed
            let currentSessionId = sessionId;
            let currentSession;

            if (!sessionId) {
              // Create new session for cached result
              const title =
                question.length > 50
                  ? question.substring(0, 50) + "..."
                  : question;

              const newSession = await db
                .insert(chatSessions)
                .values({
                  userId,
                  connectionId,
                  title,
                  messageCount: 0,
                })
                .returning();

              currentSessionId = newSession[0].id;
              currentSession = newSession;

              send("session_created", { sessionId: currentSessionId });
            } else {
              currentSession = await db
                .select()
                .from(chatSessions)
                .where(
                  and(
                    eq(chatSessions.id, sessionId),
                    eq(chatSessions.userId, userId)
                  )
                )
                .limit(1);

              if (!currentSession[0]) {
                send("error", { message: "Session not found" });
                controller.close();
                return;
              }

              if (!isMultiTurnAllowed) {
                send("error", {
                  message:
                    "Multi-turn conversations require Growth plan or higher",
                  upgradeRequired: true,
                  requiredPlan: "growth",
                });
                controller.close();
                return;
              }
            }

            // Save user message
            const userMessage = await db
              .insert(chatMessages)
              .values({
                sessionId: currentSessionId,
                role: "user",
                content: question,
              })
              .returning();

            send("user_message", { message: userMessage[0] });

            // Send cached data
            send("cached_result", {
              sql: cachedResult.sql,
              results: cachedResult.results,
              interpretation: cachedResult.interpretation,
            });

            // Save assistant message with cached data
            const assistantMessage = await db
              .insert(chatMessages)
              .values({
                sessionId: currentSessionId,
                role: "assistant",
                content: cachedResult.interpretation,
                metadata: {
                  sql: cachedResult.sql,
                  results: cachedResult.results.slice(0, 100),
                  executionTimeMs: cachedResult.executionTimeMs,
                  rowCount: cachedResult.rowCount,
                  dbType: cachedResult.dbType,
                  fromCache: true,
                  cacheKey,
                },
              })
              .returning();

            // Update session
            await db
              .update(chatSessions)
              .set({
                messageCount: (currentSession[0]?.messageCount || 0) + 2,
                updatedAt: new Date(),
              })
              .where(eq(chatSessions.id, currentSessionId));

            // Update usage
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

            send("complete", {
              sessionId: currentSessionId,
              message: assistantMessage[0],
              fromCache: true,
              canContinue: isMultiTurnAllowed,
              usageRemaining: limit - currentQueryCount - 1,
            });

            controller.close();
            return;
          }

          // ==========================================
          // 3. CACHE MISS - CONTINUE WITH NORMAL FLOW
          // ==========================================

          // Handle session
          let currentSessionId = sessionId;
          let currentSession;

          if (sessionId) {
            // Validate existing session
            currentSession = await db
              .select()
              .from(chatSessions)
              .where(
                and(
                  eq(chatSessions.id, sessionId),
                  eq(chatSessions.userId, userId)
                )
              )
              .limit(1);

            if (!currentSession[0]) {
              send("error", { message: "Session not found" });
              controller.close();
              return;
            }

            if (!isMultiTurnAllowed) {
              send("error", {
                message:
                  "Multi-turn conversations require Growth plan or higher",
                upgradeRequired: true,
                requiredPlan: "growth",
              });
              controller.close();
              return;
            }

            currentSessionId = sessionId;
          } else {
            // Create new session
            const title = question;

            const newSession = await db
              .insert(chatSessions)
              .values({
                userId,
                connectionId,
                title,
                messageCount: 0,
              })
              .returning();

            currentSessionId = newSession[0].id;
            currentSession = newSession;

            send("session_created", { sessionId: currentSessionId });
          }

          // Get database connection & schema
          send("status", {
            stage: "initializing",
            message: "Loading database schema...",
          });

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

          if (!connection[0]) {
            send("error", { message: "Database connection not found" });
            controller.close();
            return;
          }

          const dbConfig = connection[0];
          const dbType = dbConfig.type as DatabaseType;

          // Get schema (with caching)
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

          // Get conversation context if multi-turn
          let conversationContext = "";
          if (sessionId && isMultiTurnAllowed) {
            const previousMessages = await db
              .select()
              .from(chatMessages)
              .where(eq(chatMessages.sessionId, sessionId))
              .orderBy(desc(chatMessages.createdAt))
              .limit(10);

            conversationContext = previousMessages
              .toReversed()
              .map((msg) => `${msg.role}: ${msg.content}`)
              .join("\n");
          }

          // Save user message
          const userMessage = await db
            .insert(chatMessages)
            .values({
              sessionId: currentSessionId,
              role: "user",
              content: question,
            })
            .returning();

          send("user_message", { message: userMessage[0] });

          // ==========================================
          // 4. GENERATE SQL (STREAMING)
          // ==========================================
          send("status", {
            stage: "generating_sql",
            message: "Generating SQL query...",
          });

          let sql = "";
          for await (const chunk of streamSQL(
            question,
            conversationContext
              ? `${schemaContext.formatted}\n\nPrevious conversation:\n${conversationContext}`
              : schemaContext.formatted,
            userPlan,
            dbType,
            connectionId
          )) {
            sql += chunk;
            send("sql_chunk", { chunk });
          }

          // CLEAN AND VALIDATE SQL BEFORE SENDING
          let cleanedSQL: string;
          try {
            cleanedSQL = validateAndCleanSQL(sql);
          } catch (validationError: any) {
            send("error", {
              message: validationError.message,
              partial: false,
            });
            controller.close();
            return;
          }

          send("sql_generated", { sql });

          // ==========================================
          // 5. EXECUTE QUERY
          // ==========================================
          send("status", {
            stage: "executing",
            message: "Executing query...",
          });

          const startTime = Date.now();
          let results: any[] = [];
          let executionError: string | null = null;

          try {
            const queryResult = await executeQuery(
              dbConfig as ConnectionConfig,
              cleanedSQL
            );
            results = queryResult.rows;
            send("results", {
              results,
              rowCount: results.length,
              executionTimeMs: Date.now() - startTime,
            });
          } catch (err: any) {
            executionError = err.message;

            const partialMessage = await db
              .insert(chatMessages)
              .values({
                sessionId: currentSessionId,
                role: "assistant",
                content: `Query execution failed: ${executionError}`,
                metadata: {
                  sql: cleanedSQL,
                  results: undefined,
                  executionTimeMs: Date.now() - startTime,
                  rowCount: 0,
                  dbType,
                  error: executionError as string,
                  fromCache: false,
                  hasPartialError: true,
                  canRetry: true,
                },
              })
              .returning();

            // Update session message count
            await db
              .update(chatSessions)
              .set({
                messageCount: (currentSession[0]?.messageCount || 0) + 2,
                updatedAt: new Date(),
              })
              .where(eq(chatSessions.id, currentSessionId));

            // Update usage tracking (user still used a query)
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

            send("error", {
              message: `Query execution failed: ${executionError}`,
              sql: cleanedSQL,
              partial: true,
              canRetry: true,
            });

            send("complete", {
              sessionId: currentSessionId,
              message: partialMessage[0],
              canContinue: isMultiTurnAllowed,
              usageRemaining: limit - currentQueryCount - 1,
            });

            controller.close();
            return;
          }

          // ==========================================
          // 6. INTERPRET RESULTS (STREAMING)
          // ==========================================
          if (!executionError) {
            send("status", {
              stage: "interpreting",
              message: "Interpreting results...",
            });

            send("interpretation_start", {});

            let interpretation = "";
            for await (const chunk of streamInterpretation(
              question,
              cleanedSQL,
              results,
              dbType,
              userPlan
            )) {
              interpretation += chunk;
              send("interpretation_chunk", { chunk });
            }

            send("interpretation_complete", { interpretation });

            // Save assistant message
            const assistantMessage = await db
              .insert(chatMessages)
              .values({
                sessionId: currentSessionId,
                role: "assistant",
                content: interpretation,
                metadata: {
                  sql: cleanedSQL,
                  results: results.slice(0, 100), // Store only first 100 rows
                  executionTimeMs: Date.now() - startTime,
                  rowCount: results.length,
                  dbType,
                  fromCache: false,
                },
              })
              .returning();

            // Update session
            await db
              .update(chatSessions)
              .set({
                messageCount: (currentSession[0]?.messageCount || 0) + 2,
                updatedAt: new Date(),
              })
              .where(eq(chatSessions.id, currentSessionId));

            // Update usage
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

            // ==========================================
            // 7. CACHE THE RESULT IN REDIS
            // ==========================================
            try {
              await setCachedResult(cacheKey, {
                sql: cleanedSQL,
                results,
                interpretation,
                executionTimeMs: Date.now() - startTime,
                rowCount: results.length,
                dbType,
              });
            } catch (cacheError) {
              console.error("Failed to cache result:", cacheError);
              // Don't fail the request if caching fails
            }

            send("complete", {
              sessionId: currentSessionId,
              message: assistantMessage[0],
              canContinue: isMultiTurnAllowed,
              usageRemaining: limit - currentQueryCount - 1,
            });
          }

          controller.close();
        } catch (error: any) {
          console.error("Stream error:", error);
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
    console.error("SSE route error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
