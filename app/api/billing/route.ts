// app/api/billing/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

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

    // Get subscription if exists
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .limit(1);

    let subscriptionData = null;
    let invoices = [];

    if (subscription[0] && subscription[0].stripeCustomerId) {
      // Get subscription details from Stripe
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription[0].stripeSubscriptionId
        );

        subscriptionData = {
          plan: subscription[0].plan,
          status: subscription[0].status,
          currentPeriodEnd: subscription[0].currentPeriodEnd,
          cancelAtPeriodEnd: subscription[0].cancelAtPeriodEnd,
          interval:
            stripeSubscription.items.data[0].price.recurring?.interval ||
            "monthly",
        };

        // Get invoices
        const stripeInvoices = await stripe.invoices.list({
          customer: subscription[0].stripeCustomerId,
          limit: 10,
        });

        invoices = stripeInvoices.data.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid,
          status: invoice.status,
          created: invoice.created,
          invoicePdf: invoice.invoice_pdf,
        }));
      } catch (error) {
        console.error("Failed to fetch Stripe data:", error);
      }
    }

    return NextResponse.json({
      subscription: subscriptionData,
      invoices,
    });
  } catch (error) {
    console.error("Billing API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
