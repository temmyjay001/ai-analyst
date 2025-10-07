// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { chatSessions, chatMessages, users } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const sessionId = (await params).id;

    // Fetch chat session
    const chatSession = await db
      .select()
      .from(chatSessions)
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user[0].id))
      )
      .limit(1);

    if (!chatSession[0]) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch all messages in this session
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    return NextResponse.json({
      success: true,
      session: chatSession[0],
      messages: messages,
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a session
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const sessionId = (await params).id;

    // Delete session (messages cascade delete automatically)
    const result = await db
      .delete(chatSessions)
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user[0].id))
      )
      .returning();

    if (!result[0]) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete session" },
      { status: 500 }
    );
  }
}

// PATCH - Update session title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { title } = await req.json();

    if (!title || title.length > 500) {
      return NextResponse.json({ message: "Invalid title" }, { status: 400 });
    }

    const sessionId = (await params).id;

    const result = await db
      .update(chatSessions)
      .set({
        title,
        updatedAt: new Date(),
      })
      .where(
        and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, user[0].id))
      )
      .returning();

    if (!result[0]) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: result[0],
    });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json(
      { message: "Failed to update session" },
      { status: 500 }
    );
  }
}
