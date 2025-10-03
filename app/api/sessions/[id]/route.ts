// app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { chatSessions, queries, users } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const sessionId = params.id;

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
      .from(queries)
      .where(eq(queries.sessionId, sessionId))
      .orderBy(asc(queries.messageIndex));

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
