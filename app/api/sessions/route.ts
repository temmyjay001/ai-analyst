// app/api/sessions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { chatSessions, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get URL params for pagination
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, user[0].id))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(Math.min(limit, 100))
      .offset(offset);

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Sessions fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST - Create new session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { connectionId, title } = await req.json();

    if (!connectionId) {
      return NextResponse.json(
        { message: "Connection ID is required" },
        { status: 400 }
      );
    }

    // Create title from first message or use default
    const sessionTitle = title || "New Chat";

    // Create new session
    const newSession = await db
      .insert(chatSessions)
      .values({
        userId: user[0].id,
        connectionId,
        title: sessionTitle,
        messageCount: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      session: newSession[0],
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { message: "Failed to create session" },
      { status: 500 }
    );
  }
}
