// components/QueryHistory.tsx
"use client";

import React from "react";
import { Clock, Star, X } from "lucide-react";
import { QueryHistoryItem } from "@/types/query";

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (query: QueryHistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  showFavoritesOnly?: boolean;
}

export default function QueryHistory({
  history,
  onSelectQuery,
  onToggleFavorite,
  showFavoritesOnly = false,
}: QueryHistoryProps) {
  const filteredHistory = showFavoritesOnly
    ? history.filter((q) => q.favorite)
    : history;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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

  return (
    <div className="space-y-3">
      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>{showFavoritesOnly ? "No favorites yet" : "No queries yet"}</p>
          <p className="text-sm">Start asking questions to see your history</p>
        </div>
      ) : (
        filteredHistory.map((query) => (
          <div
            key={query.id}
            className="group p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
            onClick={() => onSelectQuery(query)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {query.question}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(query.timestamp)}
                  </span>
                  {query.execution_time && (
                    <span className="text-xs text-gray-400">
                      • {query.execution_time}ms
                    </span>
                  )}
                  {query.fromCache && (
                    <span className="text-xs text-green-600">• Cached</span>
                  )}
                  {query.error && (
                    <span className="text-xs text-red-500">• Error</span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(query.id);
                }}
                className="ml-2 p-1 rounded hover:bg-yellow-100 transition-colors"
              >
                <Star
                  className={`h-4 w-4 ${
                    query.favorite
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-400 group-hover:text-yellow-500"
                  }`}
                />
              </button>
            </div>

            {query.results && query.results.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {query.results.length} rows returned
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
