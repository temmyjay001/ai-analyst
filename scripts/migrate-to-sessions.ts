// scripts/migrate-to-sessions.ts
/**
 * Migration script to convert existing queries to the new session-based structure
 *
 * Run with: npx tsx scripts/migrate-to-sessions.ts
 */

import { db } from "@/lib/db";
import { queries, chatSessions, users } from "@/lib/schema";
import { eq, isNull } from "drizzle-orm";

async function migrateToSessions() {
  console.log("🚀 Starting migration to chat sessions...\n");

  try {
    // Step 1: Find all queries without a session
    console.log("📊 Step 1: Finding queries without sessions...");

    const orphanedQueries = await db
      .select()
      .from(queries)
      .where(isNull(queries.sessionId));

    console.log(`Found ${orphanedQueries.length} queries to migrate\n`);

    if (orphanedQueries.length === 0) {
      console.log("✅ No queries to migrate. All done!");
      return;
    }

    // Step 2: Get user information for each query
    console.log("👥 Step 2: Fetching user information...");

    const userMap = new Map();
    for (const query of orphanedQueries) {
      if (!userMap.has(query.userId)) {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, query.userId))
          .limit(1);

        if (user[0]) {
          userMap.set(query.userId, user[0]);
        }
      }
    }
    console.log(`Found ${userMap.size} unique users\n`);

    // Step 3: Create sessions for each query
    console.log("🔄 Step 3: Creating chat sessions...");

    let migratedCount = 0;
    let errorCount = 0;

    for (const query of orphanedQueries) {
      try {
        const user = userMap.get(query.userId);
        if (!user) {
          console.log(`⚠️  Skipping query ${query.id}: User not found`);
          errorCount++;
          continue;
        }

        // Generate title from question
        const title =
          query.question && query.question.length > 50
            ? query.question.substring(0, 50) + "..."
            : query.question || "Untitled Query";

        // Determine if plan supports multi-turn
        const isMultiTurn = ["growth", "enterprise"].includes(
          user.plan || "free"
        );

        // Create new session
        const newSession = await db
          .insert(chatSessions)
          .values({
            userId: query.userId,
            connectionId: query.connectionId,
            title,
            plan: user.plan || "free",
            isMultiTurn,
            messageCount: 2, // User message + assistant message
            createdAt: query.createdAt,
            updatedAt: query.createdAt,
          })
          .returning();

        // Create user message (if question exists)
        if (query.question) {
          await db.insert(queries).values({
            userId: query.userId,
            connectionId: query.connectionId,
            sessionId: newSession[0].id,
            role: "user",
            messageIndex: 0,
            question: query.question,
            createdAt: query.createdAt,
          });
        }

        // Update the original query to be the assistant message
        await db
          .update(queries)
          .set({
            sessionId: newSession[0].id,
            role: "assistant",
            messageIndex: 1,
          })
          .where(eq(queries.id, query.id));

        migratedCount++;

        if (migratedCount % 10 === 0) {
          console.log(
            `   Migrated ${migratedCount}/${orphanedQueries.length} queries...`
          );
        }
      } catch (error) {
        console.error(`❌ Error migrating query ${query.id}:`, error);
        errorCount++;
      }
    }

    console.log("\n✨ Migration complete!");
    console.log(`✅ Successfully migrated: ${migratedCount} queries`);
    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount} queries`);
    }
    console.log(
      "\n🎉 All done! Your database is now using the session-based structure."
    );
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateToSessions()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
