// components/QueryHistorySidebar.tsx
"use client";

import { useState } from "react";
import { Clock, Star, Trash2, Menu, X, MessageSquare } from "lucide-react";
import { QueryHistoryItem } from "@/types/history";
import { formatDistanceToNow } from "date-fns";

interface QueryHistorySidebarProps {
  history: QueryHistoryItem[];
  loading: boolean;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onDeleteQuery: (id: string) => void;
  onHistoryItemClick: (sessionId: string) => void;
}

export default function QueryHistorySidebar({
  history,
  loading,
  showSidebar,
  onToggleSidebar,
  onToggleFavorite,
  onDeleteQuery,
  onHistoryItemClick,
}: QueryHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group history by session
  const groupedHistory = filteredHistory.reduce(
    (acc, item) => {
      const sessionId = item.sessionId || item.id;
      if (!acc[sessionId]) {
        acc[sessionId] = {
          sessionId,
          title: item.question,
          queries: [],
          createdAt: new Date(item.createdAt),
          isFavorite: item.isFavorite,
        };
      }
      acc[sessionId].queries.push(item);
      return acc;
    },
    {} as Record<
      string,
      {
        sessionId: string;
        title: string;
        queries: QueryHistoryItem[];
        createdAt: Date;
        isFavorite: boolean;
      }
    >
  );

  const sessions = Object.values(groupedHistory).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <>
      {/* Mobile Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-50 h-full w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-emerald-600" />
              History
            </h2>
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? "No queries found" : "No query history yet"}
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.sessionId}
                className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => onHistoryItemClick(session.sessionId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.title.length > 50
                        ? session.title.substring(0, 50) + "..."
                        : session.title}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>
                        {session.queries.length}{" "}
                        {session.queries.length === 1 ? "message" : "messages"}
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {formatDistanceToNow(new Date(session.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(
                          session.queries[0].id,
                          !session.isFavorite
                        );
                      }}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          session.isFavorite
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            "Delete this session? This will remove all messages in this conversation."
                          )
                        ) {
                          onDeleteQuery(session.queries[0].id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Show snippet of first query */}
                {session.queries[0].interpretation && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {session.queries[0].interpretation}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
