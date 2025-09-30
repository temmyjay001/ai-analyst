import { useState } from "react";
import { History, Star, Search, X, Loader2, Clock, Trash2 } from "lucide-react";
import { QueryHistoryItem } from "@/types/history";

interface QueryHistorySidebarProps {
  show: boolean;
  history: QueryHistoryItem[];
  loading: boolean;
  onClose: () => void;
  onRerunQuery: (item: QueryHistoryItem) => void;
  onRerunFresh: (item: QueryHistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteQuery: (id: string) => void;
}

export default function QueryHistorySidebar({
  show,
  history,
  loading,
  onClose,
  onRerunQuery,
  onRerunFresh,
  onToggleFavorite,
  onDeleteQuery,
}: QueryHistorySidebarProps) {
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [search, setSearch] = useState("");

  const filteredHistory = history
    .filter((q) => {
      if (filter === "favorites" && !q.isFavorite) return false;
      if (search && !q.question.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  if (!show) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <History className="h-5 w-5 mr-2" />
            Query History
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queries..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("favorites")}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
              filter === "favorites"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Star className="h-3.5 w-3.5 mr-1" />
            Favorites
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {filter === "favorites"
                ? "No favorite queries yet"
                : search
                ? "No matching queries"
                : "No queries yet"}
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all"
            >
              <div
                className="cursor-pointer"
                onClick={() => onRerunQuery(item)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 flex-1">
                    {item.question}
                  </p>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded transition-colors"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${
                          item.isFavorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQuery(item.id);
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(item.createdAt)}
                  </span>
                  {item.rowCount !== undefined && (
                    <span>{item.rowCount} rows</span>
                  )}
                </div>
              </div>

              {item.results && item.results.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRerunFresh(item);
                  }}
                  className="mt-2 w-full px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                  🔄 Re-run Query (Get Fresh Data)
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
