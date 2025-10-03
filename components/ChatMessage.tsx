// components/ChatMessage.tsx

"use client";

import { ChatMessage } from "@/types/chat";
import {
  User,
  Bot,
  Copy,
  Check,
  Code2,
  Database,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import DeepAnalysisButton from "./DeepAnalysisButton";
import DataVisualization from "./DataVisualization";
import { ExportUtils } from "@/lib/exportUtils";
import ResultsTable from "./ResultsTable";

interface ChatMessageProps {
  message: ChatMessage;
  onDeepAnalysis?: () => void;
}

export default function ChatMessageComponent({
  message,
  onDeepAnalysis,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 dark:text-white">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message
  const metadata = message.metadata;
  const hasError = metadata?.error;

  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        {/* SQL Section */}
        {metadata?.sql && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated SQL
                </span>
                {metadata.fromCache && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full">
                    Cached
                  </span>
                )}
              </div>
              <button
                onClick={() => handleCopy(metadata.sql!)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
            <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
              <code>{metadata.sql}</code>
            </pre>
            {metadata.executionTimeMs && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Executed in {metadata.executionTimeMs}ms • {metadata.rowCount}{" "}
                rows
              </p>
            )}
          </div>
        )}

        {/* Data Visualization */}
        {metadata?.results && metadata.results.length > 0 && metadata.sql && (
          <DataVisualization data={metadata.results} />
        )}

        {/* Results Summary */}
        {metadata?.results && metadata.results.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Query returned {metadata.rowCount} rows
              </span>
            </div>
            <ResultsTable
              results={metadata.results}
              onExport={() =>
                ExportUtils.downloadCSV(
                  metadata.results as any[],
                  "query-results"
                )
              }
            />
          </div>
        )}

        {/* Error */}
        {hasError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900 dark:text-red-100">
                  Query Error
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {metadata.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Interpretation */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Deep Analysis Button */}
        {onDeepAnalysis &&
          metadata?.results &&
          metadata.results.length > 0 &&
          !metadata.isDeepAnalysis && (
            <DeepAnalysisButton onClick={onDeepAnalysis} />
          )}

        {/* Deep Analysis Results */}
        {metadata?.isDeepAnalysis && metadata.deepAnalysisSteps && (
          <div className="mt-4 space-y-3">
            <div className="font-semibold text-gray-900 dark:text-white">
              Deep Analysis Follow-ups:
            </div>
            {metadata.deepAnalysisSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3"
              >
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                  {step.stepNumber}. {step.question}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  {step.insights}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
