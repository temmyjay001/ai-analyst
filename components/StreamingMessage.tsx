// components/StreamingMessage.tsx

"use client";

import { Loader2, Code2, Database, Sparkles } from "lucide-react";
import { StreamStatus } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import ResultsTable from "./ResultsTable";
import { ExportUtils } from "@/lib/exportUtils";

interface StreamingMessageProps {
  status: StreamStatus | null;
  sql: string;
  interpretation: string;
  results: any[] | null;
  error: string | null;
}

export default function StreamingMessage({
  status,
  sql,
  interpretation,
  results,
  error,
}: Readonly<StreamingMessageProps>) {
  return (
    <div className="space-y-4">
      {/* Status Indicator */}
      {status && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{status.message}</span>
        </div>
      )}

      {/* SQL (streaming) */}
      {sql && (
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
      {results && results.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Query Results ({results.length} rows)
            </span>
          </div>
          <ResultsTable
            results={results}
            onExport={() => ExportUtils.downloadCSV(results, "query-results")}
          />
        </div>
      )}

      {/* Interpretation (streaming) */}
      {interpretation && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Analysis
            </span>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{interpretation}</ReactMarkdown>
          </div>
          {/* Typing indicator cursor */}
          <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
