// components/UnifiedMessage.tsx - Enhanced for Optimistic Updates
"use client";

import {
  ChatMessage,
  StreamStatus,
  StreamError,
  ChatSession,
} from "@/types/chat";
import {
  User,
  Bot,
  Copy,
  Check,
  Code2,
  Database,
  AlertCircle,
  Loader2,
  Sparkles,
  MessageCircleMore,
} from "lucide-react";
import { useState } from "react";
import { Markdown } from "./Markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DeepAnalysisButton from "./DeepAnalysisButton";
import DataVisualization from "./DataVisualization";
import ResultsTable from "./ResultsTable";
import RetryButton from "./RetryButton";
import { ExportUtils } from "@/lib/exportUtils";

interface UnifiedMessageProps {
  // For saved messages
  message?: ChatMessage;
  userQuestion?: string;
  session?: ChatSession;
  onDeepAnalysis?: () => void;
  onRetrySuccess?: (newMessage: ChatMessage) => void;

  // For streaming messages (when message.metadata.isStreaming === true)
  isStreaming?: boolean;
  status?: StreamStatus | null;
  streamingSql?: string;
  streamingInterpretation?: string;
  streamingResults?: any[] | null;
  streamingSuggestions?: string[];
  error?: StreamError | null;
  onDismissError?: () => void;

  // Shared
  onSuggestionClick?: (suggestion: string) => void;
  canShowSuggestions?: boolean;
}

export default function UnifiedMessage({
  message,
  userQuestion,
  session,
  onDeepAnalysis,
  onRetrySuccess,
  isStreaming = false,
  status,
  streamingSql,
  streamingInterpretation,
  streamingResults,
  streamingSuggestions,
  error,
  onDismissError,
  onSuggestionClick,
  canShowSuggestions = false,
}: Readonly<UnifiedMessageProps>) {
  const [copied, setCopied] = useState(false);

  // Determine if this is a user message or assistant message
  const isUser = message?.role === "user";
  const isAssistant = message?.role === "assistant" || isStreaming;

  // For streaming messages in the array, prioritize streaming props over message data
  // For saved messages, use message data
  const isActivelyStreaming = isStreaming || message?.metadata?.isStreaming;

  const sql = isActivelyStreaming
    ? streamingSql || message?.metadata?.sql
    : message?.metadata?.sql;

  const interpretation = isActivelyStreaming
    ? streamingInterpretation || message?.content
    : message?.content;

  const results = isActivelyStreaming
    ? streamingResults || message?.metadata?.results
    : message?.metadata?.results;

  const suggestions = isActivelyStreaming
    ? streamingSuggestions || message?.metadata?.suggestions
    : message?.metadata?.suggestions;

  const hasError = !!message?.metadata?.error || !!error;
  const errorMessage = message?.metadata?.error || error?.message;
  const isInformational = message?.metadata?.isInformational;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render user message
  if (isUser) {
    return (
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {message?.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render assistant message (streaming or saved)
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <div className="flex-1 space-y-4">
        {/* Status Indicator - Only show while actively streaming */}
        {isActivelyStreaming && status && !error && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{status.message}</span>
          </div>
        )}

        {/* SQL */}
        {sql && !error && !isInformational && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated SQL
                </span>
              </div>
              <button
                onClick={() => handleCopy(sql)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                title="Copy SQL"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
              <code>{sql}</code>
            </pre>
            {message?.metadata?.executionTimeMs && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Executed in {message.metadata.executionTimeMs}ms •{" "}
                {message.metadata.rowCount} rows
              </p>
            )}
          </div>
        )}

        {/* Results indicator */}
        {results && results.length > 0 && !error && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Query Results ({results.length} rows)
              </span>
            </div>
          </div>
        )}

        {/* Interpretation */}
        {interpretation && !error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isInformational ? "Response" : "Analysis"}
              </span>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown content={interpretation} />
            </div>
            {/* Typing indicator for actively streaming */}
            {isActivelyStreaming && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            )}
          </div>
        )}

        {/* Visualizations - Only for saved messages with results */}
        {message &&
          !isActivelyStreaming &&
          results &&
          results.length > 0 &&
          sql &&
          !hasError && (
            <DataVisualization
              data={results}
              chartMetadata={{
                question: userQuestion || "Query results",
                sql: sql,
                connectionId: session?.connectionId ?? "",
                sessionId: message.sessionId,
                messageId: message.id,
              }}
            />
          )}

        {/* Results Table - Only for saved messages with results */}
        {message &&
          !isActivelyStreaming &&
          results &&
          results.length > 0 &&
          !hasError && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Query returned {message.metadata?.rowCount || results.length}{" "}
                  rows
                </span>
              </div>
              <ResultsTable
                results={results}
                onExport={() =>
                  ExportUtils.downloadCSV(results, "query-results")
                }
              />
            </div>
          )}

        {/* Deep Analysis Button - Only for saved messages */}
        {message &&
          !isActivelyStreaming &&
          onDeepAnalysis &&
          results &&
          results.length > 0 &&
          !hasError &&
          !message.metadata?.isDeepAnalysis && (
            <DeepAnalysisButton onClick={onDeepAnalysis} />
          )}

        {/* Follow-up Suggestions - Only for saved messages, not streaming */}
        {canShowSuggestions &&
          suggestions &&
          suggestions.length > 0 &&
          !isActivelyStreaming && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircleMore className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Continue the conversation
                </span>
                <Badge variant="secondary" className="text-xs">
                  AI Suggested
                </Badge>
              </div>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-white dark:hover:bg-gray-800"
                    onClick={() => onSuggestionClick?.(suggestion)}
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {suggestion}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* Error Display */}
        {hasError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  {error?.upgradeRequired ? "Upgrade Required" : "Error"}
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {errorMessage}
                </p>

                {/* Retry Button for saved messages */}
                {message && message.metadata?.canRetry && onRetrySuccess && (
                  <RetryButton
                    messageId={message.id}
                    onSuccess={onRetrySuccess}
                    onError={(err) => console.error("Retry failed:", err)}
                  />
                )}

                {/* Dismiss button for streaming errors */}
                {isActivelyStreaming && onDismissError && (
                  <Button size="sm" variant="outline" onClick={onDismissError}>
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
