import { AlertCircle, History } from "lucide-react";
import { Message } from "@/types/message";
import DataVisualization from "./DataVisualization";
import ResultsTable from "./ResultsTable";
import { ExportUtils } from "@/lib/exportUtils";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-3xl bg-emerald-600 text-white rounded-lg px-4 py-3">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        {message.error ? (
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Error
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {message.content}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-900 dark:text-white">{message.content}</p>

            {message.fromHistory && (
              <div className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                <History className="h-3 w-3 mr-1" />
                Cached Result from History
              </div>
            )}

            {message.sql && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  SQL Query
                </p>
                <code className="text-sm text-gray-900 dark:text-white font-mono">
                  {message.sql}
                </code>
              </div>
            )}

            {message.results && message.results.length > 0 && (
              <>
                <DataVisualization data={message.results} />
                <ResultsTable
                  results={message.results}
                  onExport={() =>
                    ExportUtils.downloadCSV(message.results!, "query-results")
                  }
                />
              </>
            )}

            {message.executionTime && (
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                {message.rowCount !== undefined && (
                  <span>{message.rowCount} rows</span>
                )}
                <span>{message.executionTime}ms</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
