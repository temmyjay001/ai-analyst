// app/api/chat/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { chatSessions, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build query
    const whereConditions = [eq(chatSessions.userId, user[0].id)];

    if (connectionId && connectionId !== "undefined") {
      whereConditions.push(eq(chatSessions.connectionId, connectionId));
    }

    // Execute query with ordering and limit
    const sessions = await db
      .select()
      .from(chatSessions)
      .where(and(...whereConditions))
      .orderBy(desc(chatSessions.updatedAt))
      .limit(limit);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error loading sessions:", error);
    return NextResponse.json(
      { error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}
