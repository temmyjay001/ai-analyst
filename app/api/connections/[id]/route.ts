// app/api/connections/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { databaseConnections, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { id } = params;

    // Delete connection (only if it belongs to the user)
    const deleted = await db
      .delete(databaseConnections)
      .where(
        and(
          eq(databaseConnections.id, id),
          eq(databaseConnections.userId, user[0].id)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { message: "Connection not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete connection:", error);
    return NextResponse.json(
      { message: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
