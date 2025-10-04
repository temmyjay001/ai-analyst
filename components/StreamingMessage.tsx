// components/StreamingMessage.tsx
"use client";

import {
  Loader2,
  Code2,
  Database,
  Sparkles,
  AlertCircle,
  X,
  Crown,
  TrendingUp,
} from "lucide-react";
import { StreamStatus, StreamError } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import { Markdown } from "./Markdown";

interface StreamingMessageProps {
  status: StreamStatus | null;
  sql: string;
  interpretation: string;
  results: any[] | null;
  error: StreamError | null;
  onDismissError?: () => void;
}

export default function StreamingMessage({
  status,
  sql,
  interpretation,
  results,
  error,
  onDismissError,
}: Readonly<StreamingMessageProps>) {
  return (
    <div className="space-y-4">
      {/* Status Indicator - Only show if no error */}
      {status && !error && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{status.message}</span>
        </div>
      )}

      {/* SQL (streaming) */}
      {sql && !error && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Generated SQL
            </span>
          </div>
          <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
            <code>{sql}</code>
          </pre>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && !error && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Query Results ({results.length} rows)
            </span>
          </div>
        </div>
      )}

      {/* Interpretation (streaming) */}
      {interpretation && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis
            </span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown content={interpretation} />
          </div>
          {/* Typing indicator cursor */}
          <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
        </div>
      )}

      {/* Error - Using structured error object */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                {error.upgradeRequired
                  ? "Upgrade Required"
                  : error.limitReached
                  ? "Limit Reached"
                  : "Error"}
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                {error.message}
              </p>

              {/* Upgrade Required */}
              {error.upgradeRequired && error.requiredPlan && (
                <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-3 mb-2">
                  <div className="flex items-start gap-2">
                    <Crown className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-purple-900 dark:text-purple-100 mb-1">
                        Available on{" "}
                        {error.requiredPlan.charAt(0).toUpperCase() +
                          error.requiredPlan.slice(1)}{" "}
                        Plan
                      </p>
                      <button
                        onClick={() => (window.location.href = "/billing")}
                        className="text-xs font-semibold text-purple-700 dark:text-purple-300 underline hover:no-underline"
                      >
                        Upgrade Now →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Limit Reached */}
              {error.limitReached &&
                error.currentUsage !== undefined &&
                error.limit !== undefined && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 mb-2">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-900 dark:text-amber-100 mb-1">
                          Daily Usage: {error.currentUsage} / {error.limit}{" "}
                          queries
                        </p>
                        <button
                          onClick={() => (window.location.href = "/billing")}
                          className="text-xs font-semibold text-amber-700 dark:text-amber-300 underline hover:no-underline"
                        >
                          Upgrade for More Queries →
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {/* Deep Analysis Insufficient Queries */}
              {error.queriesNeeded !== undefined &&
                error.queriesAvailable !== undefined && (
                  <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-3 mb-2">
                    <p className="text-xs text-amber-900 dark:text-amber-100">
                      Deep Analysis requires {error.queriesNeeded} queries. You
                      have {error.queriesAvailable} remaining today.
                    </p>
                  </div>
                )}

              {/* Partial Results */}
              {error.partial && (
                <p className="text-xs text-red-700 dark:text-red-300 italic">
                  Partial results may be shown above.
                </p>
              )}
            </div>

            {/* Dismiss button */}
            {onDismissError && (
              <button
                onClick={onDismissError}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                title="Dismiss error"
              >
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
