"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, CreditCard, Download, Zap } from "lucide-react";
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const discount = billingInterval === "annual" ? 17 : 0;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(
                        subscription.currentPeriodEnd
                      ).toLocaleDateString()}`
                    : `Renews on ${new Date(
                        subscription.currentPeriodEnd
                      ).toLocaleDateString()}`}
                </p>
              </div>
              <button
                onClick={handleManageSubscription}
                className="inline-flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>

          <div className="flex items-center justify-center space-x-3 mb-8">
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

          <div className="grid md:grid-cols-3 gap-6">
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
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  3 queries/day
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
                ${billingInterval === "monthly" ? "29" : "24"}
                <span className="text-sm font-normal text-gray-500">
                  /month
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  100 queries/day
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

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Growth
              </h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ${billingInterval === "monthly" ? "99" : "82"}
                <span className="text-sm font-normal text-gray-500">
                  /month
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-600 mr-2" />
                  500 queries/day
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
          </div>
        </div>

        {invoices.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invoice History
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
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
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
