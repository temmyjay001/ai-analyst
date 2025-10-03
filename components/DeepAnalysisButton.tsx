// components/DeepAnalysisButton.tsx
"use client";

import { useState } from "react";
import {
  Brain,
  Loader2,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronUp,
  Crown,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import type { DeepAnalysisResult } from "@/lib/ai/deepAnalysis";

interface DeepAnalysisButtonProps {
  question: string;
  sql: string;
  results: any[];
  connectionId: string;
  sessionId: string;
}

export default function DeepAnalysisButton({
  question,
  sql,
  results,
  connectionId,
  sessionId,
}: Readonly<DeepAnalysisButtonProps>) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DeepAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const userPlan = useUserStore((state) => state.plan);
  const isPremium = userPlan === "growth" || userPlan === "enterprise";

  const handleDeepAnalysis = async () => {
    if (!isPremium) {
      setError("Deep Analysis is available on Growth and Enterprise plans");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/query/deep-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          sql,
          results,
          connectionId,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) {
          setError(`${data.error}. Upgrade to unlock Deep Analysis.`);
        } else {
          setError(data.error || "Failed to run deep analysis");
        }
        return;
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepNumber)) {
        next.delete(stepNumber);
      } else {
        next.add(stepNumber);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Deep Analysis Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleDeepAnalysis}
          disabled={loading || !results.length}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isPremium
              ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          <span>Deep Analysis</span>
          {!isPremium && <Crown className="h-4 w-4" />}
        </button>

        {!isPremium && (
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get 3 automatic follow-up analyses with Growth plan
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Running Deep Analysis...
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Analyzing your data with 3 intelligent follow-ups
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-red-900 dark:text-red-100">
                {error}
              </p>
              {!isPremium && (
                <button
                  onClick={() => (window.location.href = "/billing")}
                  className="mt-2 text-sm text-red-700 dark:text-red-300 underline hover:no-underline"
                >
                  Upgrade to Growth Plan →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Comprehensive Insights */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Comprehensive Analysis
                </h3>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: analysis.comprehensiveInsights
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-purple-200 dark:border-purple-800">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {analysis.followUpSteps.length} follow-up queries
              </span>
              <span>
                Completed in {(analysis.executionTimeMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Follow-up Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Follow-up Analysis ({analysis.followUpSteps.length})
            </h4>

            {analysis.followUpSteps.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Step Header */}
                <button
                  onClick={() => toggleStep(step.stepNumber)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-sm font-medium flex-shrink-0">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {step.question}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {step.purpose}
                    </p>
                  </div>
                  {expandedSteps.has(step.stepNumber) ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Step Details (Expanded) */}
                {expandedSteps.has(step.stepNumber) && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                    {/* Insights */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Findings:
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.insights}
                      </p>
                    </div>

                    {/* SQL Query */}
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white">
                        View SQL Query
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                        {step.sql}
                      </pre>
                    </details>

                    {/* Results Preview */}
                    {step.results.length > 0 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white">
                          View Results ({step.results.length} rows)
                        </summary>
                        <div className="mt-2 overflow-x-auto">
                          <table className="min-w-full text-xs border border-gray-200 dark:border-gray-700">
                            <thead className="bg-gray-100 dark:bg-gray-800">
                              <tr>
                                {Object.keys(step.results[0]).map((key) => (
                                  <th
                                    key={key}
                                    className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                                  >
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {step.results.slice(0, 5).map((row, i) => (
                                <tr
                                  key={i}
                                  className="border-b border-gray-200 dark:border-gray-700"
                                >
                                  {Object.values(row).map((value: any, j) => (
                                    <td
                                      key={j}
                                      className="px-3 py-2 text-gray-600 dark:text-gray-400"
                                    >
                                      {value?.toString() || "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {step.results.length > 5 && (
                            <p className="text-xs text-gray-500 mt-2">
                              Showing 5 of {step.results.length} rows
                            </p>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
