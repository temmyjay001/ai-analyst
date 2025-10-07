// app/api/dashboards/charts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { pinnedCharts, users } from "@/lib/schema";
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

    const chartId = (await params).id;

    const result = await db
      .delete(pinnedCharts)
      .where(
        and(eq(pinnedCharts.id, chartId), eq(pinnedCharts.userId, user[0].id))
      )
      .returning();

    if (!result[0]) {
      return NextResponse.json({ message: "Chart not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chart:", error);
    return NextResponse.json(
      { message: "Failed to delete chart" },
      { status: 500 }
    );
  }
}
