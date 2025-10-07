// app/api/dashboards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { dashboards, pinnedCharts, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
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

    const dashboardId = (await params).id;

    // Fetch dashboard
    const [dashboard] = await db
      .select()
      .from(dashboards)
      .where(
        and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user[0].id))
      )
      .limit(1);

    if (!dashboard) {
      return NextResponse.json(
        { message: "Dashboard not found" },
        { status: 404 }
      );
    }

    // Fetch pinned charts
    const charts = await db
      .select()
      .from(pinnedCharts)
      .where(eq(pinnedCharts.dashboardId, dashboardId))
      .orderBy(pinnedCharts.createdAt);

    return NextResponse.json({
      success: true,
      dashboard,
      charts,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}

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

    const dashboardId = (await params).id;

    // Delete dashboard (cascade will delete pinned charts)
    const result = await db
      .delete(dashboards)
      .where(
        and(eq(dashboards.id, dashboardId), eq(dashboards.userId, user[0].id))
      )
      .returning();

    if (!result[0]) {
      return NextResponse.json(
        { message: "Dashboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete dashboard:", error);
    return NextResponse.json(
      { message: "Failed to delete dashboard" },
      { status: 500 }
    );
  }
}
