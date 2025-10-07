// app/api/connections/[id]/route.ts - WITH CACHE INVALIDATION
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { databaseConnections, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { schemaCache } from "@/lib/schemaCache";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

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

    schemaCache.invalidate(id);
    console.log(`Cache invalidated for deleted connection: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete connection:", error);
    return NextResponse.json(
      { message: "Failed to delete connection" },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating connection (optional but recommended)
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

    const { id } = await params;
    const updateData = await req.json();

    // Update connection
    const updated = await db
      .update(databaseConnections)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(databaseConnections.id, id),
          eq(databaseConnections.userId, user[0].id)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { message: "Connection not found" },
        { status: 404 }
      );
    }

    // 🚀 INVALIDATE SCHEMA CACHE when connection details change
    schemaCache.invalidate(id);
    console.log(`Cache invalidated for updated connection: ${id}`);

    return NextResponse.json({ success: true, connection: updated[0] });
  } catch (error) {
    console.error("Failed to update connection:", error);
    return NextResponse.json(
      { message: "Failed to update connection" },
      { status: 500 }
    );
  }
}
