// app/api/dashboards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { dashboards, pinnedCharts, users } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";

// GET - Fetch user's dashboards
export async function GET(req: NextRequest) {
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

    // Check plan access
    if (!["starter", "growth", "enterprise"].includes(user[0].plan || "free")) {
      return NextResponse.json(
        { message: "Dashboard feature requires Starter plan or above" },
        { status: 403 }
      );
    }

    // Fetch user's dashboards
    const userDashboards = await db
      .select({
        id: dashboards.id,
        name: dashboards.name,
        description: dashboards.description,
        isDefault: dashboards.isDefault,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt,
      })
      .from(dashboards)
      .where(eq(dashboards.userId, user[0].id))
      .orderBy(desc(dashboards.isDefault), desc(dashboards.updatedAt));

    // Get chart counts for each dashboard
    const dashboardsWithCounts = await Promise.all(
      userDashboards.map(async (dashboard) => {
        const charts = await db
          .select({ count: sql<number>`count(*)` })
          .from(pinnedCharts)
          .where(eq(pinnedCharts.dashboardId, dashboard.id));

        return {
          ...dashboard,
          chartCount: Number(charts[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({
      success: true,
      dashboards: dashboardsWithCounts,
    });
  } catch (error) {
    console.error("Failed to fetch dashboards:", error);
    return NextResponse.json(
      { message: "Failed to fetch dashboards" },
      { status: 500 }
    );
  }
}

// POST - Create new dashboard
export async function POST(req: NextRequest) {
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

    // Check plan access
    if (!["starter", "growth", "enterprise"].includes(user[0].plan || "free")) {
      return NextResponse.json(
        { message: "Dashboard feature requires Starter plan or above" },
        { status: 403 }
      );
    }

    const { name, description, isDefault } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Dashboard name is required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .update(dashboards)
        .set({ isDefault: false })
        .where(eq(dashboards.userId, user[0].id));
    }

    // Create dashboard
    const [dashboard] = await db
      .insert(dashboards)
      .values({
        userId: user[0].id,
        name,
        description: description || null,
        isDefault: isDefault || false,
      })
      .returning();

    return NextResponse.json({
      success: true,
      dashboard,
    });
  } catch (error) {
    console.error("Failed to create dashboard:", error);
    return NextResponse.json(
      { message: "Failed to create dashboard" },
      { status: 500 }
    );
  }
}
