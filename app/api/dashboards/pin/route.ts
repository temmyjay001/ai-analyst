// app/api/dashboards/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { pinnedCharts, dashboards, users, chatSessions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
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

    // Check plan access
    if (!["starter", "growth", "enterprise"].includes(user[0].plan || "free")) {
      return NextResponse.json(
        { message: "Pin to Dashboard requires Starter plan or above" },
        { status: 403 }
      );
    }

    const {
      dashboardId,
      title,
      chartType,
      connectionId,
      sessionId,
      messageId,
      sql,
      question,
      vizConfig,
      cachedData,
    } = await req.json();

    // Validate required fields
    if (!dashboardId || !title || !chartType || !sql || !vizConfig) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify dashboard belongs to user
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(eq(dashboards.id, dashboardId))
      .limit(1);

    if (!dashboard || dashboard.userId !== user[0].id) {
      return NextResponse.json(
        { message: "Dashboard not found" },
        { status: 404 }
      );
    }

    // Get connectionId from session if not provided
    let actualConnectionId = connectionId;
    if (!actualConnectionId && sessionId) {
      const [chatSession] = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, sessionId))
        .limit(1);

      if (chatSession) {
        actualConnectionId = chatSession.connectionId;
      }
    }

    if (!actualConnectionId) {
      return NextResponse.json(
        { message: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Create pinned chart
    const [chart] = await db
      .insert(pinnedCharts)
      .values({
        userId: user[0].id,
        dashboardId,
        title,
        chartType,
        connectionId: actualConnectionId,
        sessionId: sessionId || null,
        messageId: messageId || null,
        sql,
        question: question || title,
        vizConfig,
        cachedData: cachedData || null,
        lastRefreshedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      chart,
    });
  } catch (error) {
    console.error("Failed to pin chart:", error);
    return NextResponse.json(
      { message: "Failed to pin chart" },
      { status: 500 }
    );
  }
}
