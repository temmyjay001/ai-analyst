// components/UsageDisplay.tsx
"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { BillingUpgrade } from "./BillingUpgrade";
import { useUserStore } from "@/store/userStore";

export default function UsageDisplay() {
  const [showTooltip, setShowTooltip] = useState(false);
  const { usage, plan } = useUserStore();

  if (!usage) return null;

  const dailyPercent = (usage.dailyQueries / usage.dailyLimit) * 100;
  const monthlyPercent = (usage.monthlyQueries / usage.monthlyLimit) * 100;
  const isNearLimit = dailyPercent >= 80;
  const isAtLimit = dailyPercent >= 100;

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <Zap
          className={`h-4 w-4 ${
            isAtLimit
              ? "text-red-500"
              : isNearLimit
              ? "text-amber-500"
              : "text-emerald-600"
          }`}
        />
        <div className="text-left">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {usage.dailyQueries}/{usage.dailyLimit}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            queries today
          </div>
        </div>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Usage
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.dailyQueries}/{usage.dailyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isAtLimit
                      ? "bg-red-500"
                      : isNearLimit
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{ width: `${Math.min(dailyPercent, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly Usage
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.monthlyQueries}/{usage.monthlyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
                />
              </div>
            </div>

            {isNearLimit && plan === "free" && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <BillingUpgrade
                  variant="link"
                  className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium p-0 h-auto"
                >
                  Upgrade for more queries →
                </BillingUpgrade>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
