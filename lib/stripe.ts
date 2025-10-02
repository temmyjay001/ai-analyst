// lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil",
  typescript: true,
});

// Pricing configuration - Ultra-Aggressive Pricing Strategy
export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    queries_per_day: 3,
    queries_per_month: 90,
    connections: 1,
    history_days: 7,
  },
  starter: {
    name: "Starter",
    monthlyPrice: 9,
    annualPrice: 94, // 13% discount ($7.83/mo effective)
    queries_per_day: 50,
    queries_per_month: 1500,
    connections: 3,
    history_days: 30,
    stripePriceIdMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
  },
  growth: {
    name: "Growth",
    monthlyPrice: 39,
    annualPrice: 408, // 13% discount ($34/mo effective)
    queries_per_day: 300,
    queries_per_month: 9000,
    connections: 10,
    history_days: 90,
    stripePriceIdMonthly: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID,
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    queries_per_day: 999999,
    queries_per_month: 999999,
    connections: 999,
    history_days: 365,
  },
} as const;

export type PlanType = keyof typeof PLANS;

// Helper functions
export function getPlanLimits(plan: PlanType) {
  return PLANS[plan];
}

export function getStripePriceId(
  plan: PlanType,
  interval: "monthly" | "annual"
) {
  if (plan === "starter") {
    return interval === "monthly"
      ? PLANS.starter.stripePriceIdMonthly
      : PLANS.starter.stripePriceIdAnnual;
  }
  if (plan === "growth") {
    return interval === "monthly"
      ? PLANS.growth.stripePriceIdMonthly
      : PLANS.growth.stripePriceIdAnnual;
  }
  return null;
}
