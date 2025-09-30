import { BarChart3 } from "lucide-react";

const SAMPLE_QUERIES = [
  "Show me total sales by month",
  "What are the top 10 customers by revenue?",
  "How many active users do we have?",
  "What's the average order value this year?",
];

interface EmptyStateProps {
  onSelectQuery: (query: string) => void;
}

export default function EmptyState({ onSelectQuery }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-4">
        <BarChart3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Start analyzing your data
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Ask questions like:
      </p>
      <div className="grid gap-3 max-w-2xl mx-auto">
        {SAMPLE_QUERIES.map((query) => (
          <button
            key={query}
            onClick={() => onSelectQuery(query)}
            className="p-4 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
          >
            <p className="text-sm text-gray-900 dark:text-white">{query}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
