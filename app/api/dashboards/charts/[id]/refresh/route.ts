// app/api/dashboards/charts/[id]/refresh/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { pinnedCharts, users, databaseConnections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { executeQuery, ConnectionConfig } from "@/lib/database/factory";

export async function POST(
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

    // Get chart
    const [chart] = await db
      .select()
      .from(pinnedCharts)
      .where(eq(pinnedCharts.id, chartId))
      .limit(1);

    if (!chart || chart.userId !== user[0].id) {
      return NextResponse.json({ message: "Chart not found" }, { status: 404 });
    }

    // Get connection
    const [connection] = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.id, chart.connectionId))
      .limit(1);

    if (!connection) {
      return NextResponse.json(
        { message: "Database connection not found" },
        { status: 404 }
      );
    }

    // Re-execute query
    let results: any[] = [];
    try {
      const queryResult = await executeQuery(
        connection as ConnectionConfig,
        chart.sql
      );
      results = queryResult.rows;
    } catch (error: any) {
      return NextResponse.json(
        { message: `Query failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Update cached data
    await db
      .update(pinnedCharts)
      .set({
        cachedData: results,
        lastRefreshedAt: new Date(),
      })
      .where(eq(pinnedCharts.id, chartId));

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Failed to refresh chart:", error);
    return NextResponse.json(
      { message: "Failed to refresh chart" },
      { status: 500 }
    );
  }
}
