// app/billing/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  CreditCard,
  Download,
  AlertCircle,
  Zap,
} from "lucide-react";
import AppNav from "@/components/AppNav";

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [upgradingToPlan, setUpgradingToPlan] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBillingInfo();
    }
  }, [status]);

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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.plan || "free";
  const discount = billingInterval === "annual" ? 17 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Plan Status */}
        {subscription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Plan:{" "}
                  {subscription.plan.charAt(0).toUpperCase() +
                    subscription.plan.slice(1)}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subscription.cancelAtPeriodEnd ? (
                    <>
                      <AlertCircle className="inline h-4 w-4 mr-1 text-amber-500" />
                      Cancels on{" "}
                      {new Date(
                        subscription.currentPeriodEnd
                      ).toLocaleDateString()}
                    </>
                  ) : (
                    <>
                      Renews on{" "}
                      {new Date(
                        subscription.currentPeriodEnd
                      ).toLocaleDateString()}
                      ({subscription.interval})
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={handleManageSubscription}
                className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* Billing Interval Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "monthly"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("annual")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === "annual"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Free
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                $0
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                10 queries per day
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />1 database
                connection
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                7-day query history
              </li>
            </ul>

            {currentPlan === "free" ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={handleManageSubscription}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Downgrade
              </button>
            )}
          </div>

          {/* Starter Plan */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 p-6 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Starter
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ${billingInterval === "monthly" ? "29" : "24"}
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
              {billingInterval === "annual" && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  $290 billed annually
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                100 queries per day
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />3 database
                connections
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                30-day query history
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4 text-amber-500 mr-2" />
                Advanced AI models
              </li>
            </ul>

            {currentPlan === "starter" ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade("starter", billingInterval)}
                disabled={upgradingToPlan === "starter"}
                className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {upgradingToPlan === "starter" ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : currentPlan === "free" ? (
                  "Upgrade to Starter"
                ) : (
                  "Switch to Starter"
                )}
              </button>
            )}
          </div>

          {/* Growth Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Growth
            </h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                ${billingInterval === "monthly" ? "99" : "82.50"}
              </span>
              <span className="text-gray-500 dark:text-gray-400">/month</span>
              {billingInterval === "annual" && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  $990 billed annually
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                500 queries per day
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                10 database connections
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-4 w-4 text-emerald-600 mr-2" />
                90-day query history
              </li>
              <li className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Zap className="h-4 w-4 text-amber-500 mr-2" />
                Premium AI models
              </li>
            </ul>

            {currentPlan === "growth" ? (
              <button
                disabled
                className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium"
              >
                Current Plan
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade("growth", billingInterval)}
                disabled={upgradingToPlan === "growth"}
                className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {upgradingToPlan === "growth" ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : currentPlan === "free" || currentPlan === "starter" ? (
                  "Upgrade to Growth"
                ) : (
                  "Switch to Growth"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Invoices */}
        {invoices.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Billing History
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        ${(invoice.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <a
                          href={invoice.invoicePdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:text-emerald-700 inline-flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
