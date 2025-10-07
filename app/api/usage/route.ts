// app/api/usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { users, usageTracking } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { PLANS } from "@/lib/stripe";

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

    const userPlan = user[0].plan || "free";
    const planLimits = PLANS[userPlan as keyof typeof PLANS];

    // Get today's usage
    const today = new Date().toISOString().split("T")[0];
    const todayUsage = await db
      .select()
      .from(usageTracking)
      .where(
        and(eq(usageTracking.userId, user[0].id), eq(usageTracking.date, today))
      )
      .limit(1);

    const queryCount = todayUsage[0]?.queryCount || 0;

    // Get this month's usage
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    const monthUsage = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, user[0].id),
          eq(usageTracking.date, monthStartStr)
        )
      );

    const monthlyQueryCount = monthUsage.reduce(
      (sum, day) => sum + (day.queryCount || 0),
      0
    );

    return NextResponse.json({
      plan: userPlan,
      limits: {
        dailyQueries: planLimits.queries_per_day,
        monthlyQueries: planLimits.queries_per_month,
        connections: planLimits.connections,
        historyDays: planLimits.history_days,
      },
      usage: {
        dailyQueries: queryCount,
        monthlyQueries: monthlyQueryCount,
        dailyRemaining: Math.max(0, planLimits.queries_per_day - queryCount),
        monthlyRemaining: Math.max(
          0,
          planLimits.queries_per_month - monthlyQueryCount
        ),
      },
      percentages: {
        daily: Math.min(
          100,
          (queryCount / planLimits.queries_per_day) * 100
        ).toFixed(1),
        monthly: Math.min(
          100,
          (monthlyQueryCount / planLimits.queries_per_month) * 100
        ).toFixed(1),
      },
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
