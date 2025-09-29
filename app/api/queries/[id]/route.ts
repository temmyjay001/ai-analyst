// app/api/queries/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { queries, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // FIXED: Await params in Next.js 15
    const { id } = await params;

    // Delete query (only if it belongs to the user)
    const deleted = await db
      .delete(queries)
      .where(and(eq(queries.id, id), eq(queries.userId, user[0].id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Query not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete query error:", error);
    return NextResponse.json(
      { message: "Failed to delete query" },
      { status: 500 }
    );
  }
}

// Optional: GET single query details
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

    // FIXED: Await params in Next.js 15
    const { id } = await params;

    const query = await db
      .select()
      .from(queries)
      .where(and(eq(queries.id, id), eq(queries.userId, user[0].id)))
      .limit(1);

    if (!query[0]) {
      return NextResponse.json({ message: "Query not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, query: query[0] });
  } catch (error) {
    console.error("Get query error:", error);
    return NextResponse.json(
      { message: "Failed to fetch query" },
      { status: 500 }
    );
  }
}
