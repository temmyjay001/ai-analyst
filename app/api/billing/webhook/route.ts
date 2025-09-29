// app/api/billing/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ message: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { message: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    console.error("Missing metadata in checkout session");
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get subscription details from Stripe
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscriptionId
  );

  // Get current period from subscription items
  const subscriptionItem = stripeSubscription.items.data[0];

  // Upsert subscription in database
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const subscriptionData = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    plan,
    status: stripeSubscription.status,
    currentPeriodStart: new Date(subscriptionItem.current_period_start * 1000),
    currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    updatedAt: new Date(),
  };

  if (existing[0]) {
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values({
      userId,
      ...subscriptionData,
    });
  }

  // Update user plan
  await db.update(users).set({ plan }).where(eq(users.id, userId));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find subscription by customer ID
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!existing[0]) {
    console.error("Subscription not found for customer:", customerId);
    return;
  }

  // Determine plan from price ID
  const priceId = subscription.items.data[0]?.price.id;
  let plan = existing[0].plan;

  // Map price ID to plan
  if (
    priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_STARTER_ANNUAL_PRICE_ID
  ) {
    plan = "starter";
  } else if (
    priceId === process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID
  ) {
    plan = "growth";
  }

  // Get current period from subscription items
  const subscriptionItem = subscription.items.data[0];

  // Update subscription
  await db
    .update(subscriptions)
    .set({
      plan,
      status: subscription.status,
      currentPeriodStart: new Date(
        subscriptionItem.current_period_start * 1000
      ),
      currentPeriodEnd: new Date(subscriptionItem.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing[0].id));

  // Update user plan
  await db.update(users).set({ plan }).where(eq(users.id, existing[0].userId));
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find subscription
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!existing[0]) {
    return;
  }

  // Update to canceled status
  await db
    .update(subscriptions)
    .set({
      status: "canceled",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing[0].id));

  // Downgrade user to free
  await db
    .update(users)
    .set({ plan: "free" })
    .where(eq(users.id, existing[0].userId));
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find subscription
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!existing[0]) {
    return;
  }

  // Get user email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, existing[0].userId))
    .limit(1);

  if (!user[0]) {
    return;
  }

  // TODO: Send email notification about failed payment
  console.log(`Payment failed for user: ${user[0].email}`);

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing[0].id));
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find subscription
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);

  if (!existing[0]) {
    return;
  }

  // Update subscription status to active
  await db
    .update(subscriptions)
    .set({
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existing[0].id));
}
