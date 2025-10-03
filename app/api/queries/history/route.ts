// app/api/queries/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { queries, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

    // Get query limit from URL params (default 50)
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Fetch query history - only assistant messages to avoid duplicates
    const queryHistory = await db
      .select({
        id: queries.id,
        sessionId: queries.sessionId,
        question: queries.question,
        sqlGenerated: queries.sqlGenerated,
        results: queries.results,
        interpretation: queries.interpretation,
        executionTimeMs: queries.executionTimeMs,
        rowCount: queries.rowCount,
        isFavorite: queries.isFavorite,
        error: queries.error,
        createdAt: queries.createdAt,
      })
      .from(queries)
      .where(eq(queries.userId, user[0].id))
      .orderBy(desc(queries.createdAt))
      .limit(Math.min(limit, 100)); // Cap at 100

    return NextResponse.json({
      success: true,
      queries: queryHistory,
      count: queryHistory.length,
    });
  } catch (error) {
    console.error("Query history fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch query history" },
      { status: 500 }
    );
  }
}
