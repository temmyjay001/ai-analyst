"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, CreditCard, Download, Zap, Mail } from "lucide-react";
import { useUserStore } from "@/store/userStore";

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  interval: "monthly" | "annual";
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  created: number;
  invoicePdf: string;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [upgradingToPlan, setUpgradingToPlan] = useState<string | null>(null);
  const currentPlan = useUserStore((state) => state.plan);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch("/api/billing");
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch billing info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (
    plan: string,
    interval: "monthly" | "annual"
  ) => {
    setUpgradingToPlan(plan);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to create checkout session:", error);
    } finally {
      setUpgradingToPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    }
  };

  const handleContactSales = () => {
    window.location.href =
      "mailto:sales@dw?subject=Enterprise Plan Inquiry";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const discount = 13; // 13% annual discount

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan */}
        {subscription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Current Plan
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-emerald-600 capitalize mb-1">
                  {subscription.plan}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Status:{" "}
                  <span className="capitalize">{subscription.status}</span>
                </p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {subscription.cancelAtPeriodEnd
                      ? "Cancels on"
                      : "Renews on"}
                    :{" "}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleManageSubscription}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Available Plans
          </h2>

          {/* Billing Interval Toggle */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                billingInterval === "annual"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Annual
              <span className="absolute -top-3 -right-10 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save {discount}%
              </span>
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {/* Free Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Free
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                $0
                <span className="text-sm font-normal text-gray-500">
                  /month
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />3
                  queries/day
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />1
                  connection
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  7-day history
                </li>
              </ul>
              {currentPlan === "free" && (
                <button
                  disabled
                  className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              )}
            </div>

            {/* Starter Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-emerald-600 p-6 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Popular
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Starter
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ${billingInterval === "monthly" ? "9" : "94"}
                <span className="text-sm font-normal text-gray-500">
                  /{billingInterval === "monthly" ? "month" : "year"}
                </span>
              </div>
              {billingInterval === "annual" && (
                <p className="text-xs text-emerald-600 mb-2">
                  $7.83/month billed annually
                </p>
              )}
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  50 queries/day
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />3
                  connections
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  30-day history
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade("starter", billingInterval)}
                disabled={
                  upgradingToPlan === "starter" || currentPlan === "starter"
                }
                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {upgradingToPlan === "starter" ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : currentPlan === "starter" ? (
                  "Current Plan"
                ) : (
                  "Upgrade"
                )}
              </button>
            </div>

            {/* Growth Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Growth
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ${billingInterval === "monthly" ? "39" : "408"}
                <span className="text-sm font-normal text-gray-500">
                  /{billingInterval === "monthly" ? "month" : "year"}
                </span>
              </div>
              {billingInterval === "annual" && (
                <p className="text-xs text-emerald-600 mb-2">
                  $34/month billed annually
                </p>
              )}
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  300 queries/day
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  10 connections
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  90-day history
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade("growth", billingInterval)}
                disabled={
                  upgradingToPlan === "growth" || currentPlan === "growth"
                }
                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {upgradingToPlan === "growth" ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : currentPlan === "growth" ? (
                  "Current Plan"
                ) : (
                  "Upgrade"
                )}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Enterprise
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Custom
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  Unlimited queries
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  Unlimited connections
                </li>
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  Dedicated support
                </li>
              </ul>
              <button
                onClick={handleContactSales}
                className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contact Sales
              </button>
            </div>
          </div>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Billing History
            </h2>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${(invoice.amount / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(invoice.created * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {invoice.status}
                    </span>
                    {invoice.invoicePdf && (
                      <a
                        href={invoice.invoicePdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
