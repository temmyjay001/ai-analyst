// components/UsageDisplay.tsx
"use client";

import { useState, useEffect } from "react";
import { Zap, AlertCircle } from "lucide-react";
import Link from "next/link";

interface UsageData {
  plan: string;
  limits: {
    dailyQueries: number;
    monthlyQueries: number;
  };
  usage: {
    dailyQueries: number;
    monthlyQueries: number;
    dailyRemaining: number;
    monthlyRemaining: number;
  };
  percentages: {
    daily: string;
    monthly: string;
  };
}

export default function UsageDisplay() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return null;
  }

  const dailyPercent = parseFloat(usage.percentages.daily);
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
            {usage.usage.dailyQueries}/{usage.limits.dailyQueries}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            queries today
          </div>
        </div>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Usage
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {usage.usage.dailyQueries}/{usage.limits.dailyQueries}
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
                  {usage.usage.monthlyQueries}/{usage.limits.monthlyQueries}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-emerald-600 transition-all"
                  style={{
                    width: `${Math.min(
                      parseFloat(usage.percentages.monthly),
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Current Plan
                </span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {usage.plan}
                </span>
              </div>
            </div>

            {isAtLimit && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-600 dark:text-red-400">
                    Daily limit reached.{" "}
                    <Link
                      href="/billing"
                      className="underline font-semibold hover:text-red-700"
                    >
                      Upgrade now
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!isAtLimit && isNearLimit && (
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    Approaching daily limit.{" "}
                    <Link
                      href="/billing"
                      className="underline font-semibold hover:text-amber-700"
                    >
                      Upgrade plan
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
