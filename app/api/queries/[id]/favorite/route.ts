// app/api/queries/[id]/favorite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { queries, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
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

    const { id } = await params;

    // Get current query to toggle favorite
    const currentQuery = await db
      .select({ isFavorite: queries.isFavorite })
      .from(queries)
      .where(and(eq(queries.id, id), eq(queries.userId, user[0].id)))
      .limit(1);

    if (!currentQuery[0]) {
      return NextResponse.json({ message: "Query not found" }, { status: 404 });
    }

    // Toggle favorite
    const updated = await db
      .update(queries)
      .set({ isFavorite: !currentQuery[0].isFavorite })
      .where(and(eq(queries.id, id), eq(queries.userId, user[0].id)))
      .returning({ isFavorite: queries.isFavorite });

    return NextResponse.json({
      success: true,
      isFavorite: updated[0]?.isFavorite,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return NextResponse.json(
      { message: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
