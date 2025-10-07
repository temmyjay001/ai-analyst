// app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe, getStripePriceId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { plan, interval } = await req.json();

    if (!plan || !interval) {
      return NextResponse.json(
        { message: "Plan and interval are required" },
        { status: 400 }
      );
    }

    if (plan !== "starter" && plan !== "growth") {
      return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
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

    // Get price ID
    const priceId = getStripePriceId(plan, interval);

    if (!priceId) {
      return NextResponse.json(
        { message: "Price ID not configured" },
        { status: 500 }
      );
    }

    // Check if user already has a subscription
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .limit(1);

    let checkoutSession;

    if (existingSubscription[0]?.stripeCustomerId) {
      // User has existing subscription - update it
      checkoutSession = await stripe.checkout.sessions.create({
        customer: existingSubscription[0].stripeCustomerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          proration_behavior: "create_prorations",
        },
        success_url: `${process.env.NEXTAUTH_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
        metadata: {
          userId: user[0].id,
          plan,
          interval,
        },
      });
    } else {
      // New subscription
      checkoutSession = await stripe.checkout.sessions.create({
        customer_email: user[0].email,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/billing?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/billing?canceled=true`,
        metadata: {
          userId: user[0].id,
          plan,
          interval,
        },
      });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
