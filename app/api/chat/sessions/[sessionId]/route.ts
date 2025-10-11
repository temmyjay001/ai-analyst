// app/api/chat/sessions/[sessionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { chatSessions, chatMessages, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get params
    const { sessionId } = await params;

    // Get session
    const chatSession = await db
      .select()
      .from(chatSessions)
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user[0].id))
      )
      .limit(1);

    if (!chatSession[0]) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get messages
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);

    return NextResponse.json({
      session: chatSession[0],
      messages,
    });
  } catch (error) {
    console.error("Error loading session:", error);
    return NextResponse.json(
      { error: "Failed to load session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get params
    const { sessionId } = await params;

    // Verify ownership and delete
    const result = await db
      .delete(chatSessions)
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user[0].id))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
