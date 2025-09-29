// app/app/page.tsx - Enhanced Chat Interface with History Sidebar
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Send,
  Database,
  Loader2,
  Plus,
  BarChart3,
  Download,
  Clock,
  AlertCircle,
  Star,
  Search,
  Menu,
  X,
  Filter,
  History,
  Trash2,
} from "lucide-react";
import DataVisualization from "@/components/DataVisualization";
import AppNav from "@/components/AppNav";

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  database: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sql?: string;
  results?: any[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  timestamp: Date;
  fromHistory?: boolean; // NEW: Track if this is from history
}

interface QueryHistoryItem {
  id: string;
  question: string;
  sql?: string;
  results?: any[];
  interpretation?: string;
  executionTimeMs?: number;
  rowCount?: number;
  isFavorite: boolean;
  createdAt: string;
  error?: string;
}

export default function ChatInterface() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Connection & Query State
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);

  // Chat Session Management - NEW
  const [currentChatId, setCurrentChatId] = useState<string>(
    () => `chat-${Date.now()}`
  );
  const [chatSessions, setChatSessions] = useState<Map<string, Message[]>>(
    new Map()
  );

  // History Sidebar State
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<"all" | "favorites">(
    "all"
  );
  const [historySearch, setHistorySearch] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConnections();
      fetchQueryHistory();
    }
  }, [status]);

  // Load messages for current chat session
  useEffect(() => {
    const sessionMessages = chatSessions.get(currentChatId) || [];
    setMessages(sessionMessages);
  }, [currentChatId, chatSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/connections");
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
        if (data.length > 0 && !selectedConnection) {
          setSelectedConnection(data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchQueryHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await fetch("/api/queries/history");
      if (response.ok) {
        const data = await response.json();
        setQueryHistory(data.queries || []);
      }
    } catch (error) {
      console.error("Failed to fetch query history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleFavorite = async (queryId: string) => {
    try {
      const response = await fetch(`/api/queries/${queryId}/favorite`, {
        method: "PATCH",
      });

      if (response.ok) {
        // Update local state
        setQueryHistory((prev) =>
          prev.map((q) =>
            q.id === queryId ? { ...q, isFavorite: !q.isFavorite } : q
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const deleteQuery = async (queryId: string) => {
    if (!confirm("Delete this query from history?")) return;

    try {
      const response = await fetch(`/api/queries/${queryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setQueryHistory((prev) => prev.filter((q) => q.id !== queryId));
      }
    } catch (error) {
      console.error("Failed to delete query:", error);
    }
  };

  const rerunQueryFresh = (historyItem: QueryHistoryItem) => {
    startNewChat();
    setInput(historyItem.question);
    setTimeout(() => {
      handleSubmit(new Event("submit") as any, historyItem.question);
    }, 100);
  };

  const startNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const saveCurrentChatSession = () => {
    if (messages.length > 0) {
      setChatSessions((prev) => {
        const updated = new Map(prev);
        updated.set(currentChatId, messages);
        return updated;
      });
    }
  };

  const rerunQuery = (historyItem: QueryHistoryItem) => {
    startNewChat();
    if (historyItem.results && historyItem.results.length > 0) {
      // Display the cached results
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: historyItem.question,
        timestamp: new Date(historyItem.createdAt),
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: historyItem.interpretation || "Query results from history",
        sql: historyItem.sql,
        results: historyItem.results,
        rowCount: historyItem.rowCount,
        executionTime: historyItem.executionTimeMs,
        error: historyItem.error,
        timestamp: new Date(historyItem.createdAt),
        fromHistory: true, // Mark as from history
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      scrollToBottom();
    } else if (historyItem.error) {
      // Show the error from history
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: historyItem.question,
        timestamp: new Date(historyItem.createdAt),
      };

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This query failed previously.",
        sql: historyItem.sql,
        error: historyItem.error,
        timestamp: new Date(historyItem.createdAt),
      };

      setMessages((prev) => [...prev, userMessage, errorMessage]);
      scrollToBottom();
    } else {
      // No results cached, re-run the query
      setInput(historyItem.question);
      setTimeout(() => {
        handleSubmit(new Event("submit") as any, historyItem.question);
      }, 100);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    questionOverride?: string
  ) => {
    e.preventDefault();
    const questionToSubmit = questionOverride || input;

    if (!questionToSubmit.trim() || !selectedConnection || loading) return;

    // Save current session before starting new query
    saveCurrentChatSession();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: questionToSubmit,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: selectedConnection,
          question: questionToSubmit,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.interpretation || "Query executed successfully",
        sql: data.sql,
        results: data.results,
        rowCount: data.rowCount,
        executionTime: data.executionTime,
        error: data.error,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to current session
      setChatSessions((prev) => {
        const updated = new Map(prev);
        updated.set(currentChatId, finalMessages);
        return updated;
      });

      // Refresh history after successful query
      if (data.success) {
        fetchQueryHistory();
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "Failed to process your query. Please try again.",
        error: "Network error",
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);

      // Save to current session
      setChatSessions((prev) => {
        const updated = new Map(prev);
        updated.set(currentChatId, finalMessages);
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (results: any[]) => {
    if (!results || results.length === 0) return;

    const headers = Object.keys(results[0]);
    const csvContent = [
      headers.join(","),
      ...results.map((row) =>
        headers
          .map((h) => {
            const value = row[h];
            if (value === null || value === undefined) return "";
            if (typeof value === "string" && value.includes(",")) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter history
  const filteredHistory = queryHistory
    .filter((q) => {
      if (historyFilter === "favorites" && !q.isFavorite) return false;
      if (
        historySearch &&
        !q.question.toLowerCase().includes(historySearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (status === "loading" || loadingConnections) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <AppNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <AppNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Database Connected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Connect your first database to start analyzing your data with AI.
            </p>
            <button
              onClick={() => router.push("/connections")}
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Database Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <AppNav />

      <div className="flex-1 flex overflow-hidden">
        <div
          className={`${
            showSidebar ? "w-80" : "w-0"
          } transition-all duration-300 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden`}
        >
          <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <History className="h-5 w-5 mr-2" />
                Query History
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search queries..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setHistoryFilter("all")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  historyFilter === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHistoryFilter("favorites")}
                className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                  historyFilter === "favorites"
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
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {historyFilter === "favorites"
                    ? "No favorite queries yet"
                    : historySearch
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
                  {/* Main clickable area - shows cached results */}
                  <div
                    className="cursor-pointer"
                    onClick={() => rerunQuery(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 flex-1">
                        {item.question}
                      </p>
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded transition-colors"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              item.isFavorite
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuery(item.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.executionTimeMs && (
                        <span>• {item.executionTimeMs}ms</span>
                      )}
                      {item.error && (
                        <span className="text-red-500">• Error</span>
                      )}
                    </div>

                    {item.rowCount !== undefined && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {item.rowCount} rows returned
                      </p>
                    )}
                  </div>

                  {/* Re-run button - only show if results exist */}
                  {item.results && item.results.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        rerunQueryFresh(item);
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

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {!showSidebar && (
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        AI Database Analyst
                      </h1>
                      {/* New Chat Button */}
                      <button
                        onClick={startNewChat}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="New Chat"
                      >
                        <Plus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ask questions about your data in plain English
                    </p>
                  </div>
                </div>

                {/* Connection Selector */}
                <select
                  value={selectedConnection}
                  onChange={(e) => setSelectedConnection(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.database})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {messages.length === 0 ? (
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
                    {[
                      "Show me total sales by month",
                      "What are the top 10 customers by revenue?",
                      "How many active users do we have?",
                      "What's the average order value this year?",
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(example)}
                        className="text-left px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                      >
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {example}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-4">
                    {message.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-3xl bg-emerald-600 text-white rounded-lg px-4 py-3">
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ) : (
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
                              <p className="text-gray-900 dark:text-white">
                                {message.content}
                              </p>

                              {/* Badge for cached results */}
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

                              {message.results &&
                                message.results.length > 0 && (
                                  <>
                                    {/* Data Visualization */}
                                    <DataVisualization data={message.results} />

                                    {/* Export Button */}
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() =>
                                          downloadCSV(message.results!)
                                        }
                                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                      </button>
                                    </div>

                                    {/* Results Table */}
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                          <tr>
                                            {Object.keys(
                                              message.results[0]
                                            ).map((key) => (
                                              <th
                                                key={key}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                              >
                                                {key}
                                              </th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                          {message.results
                                            .slice(0, 10)
                                            .map((row, idx) => (
                                              <tr key={idx}>
                                                {Object.values(row).map(
                                                  (value: any, cellIdx) => (
                                                    <td
                                                      key={cellIdx}
                                                      className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap"
                                                    >
                                                      {value?.toString() || "—"}
                                                    </td>
                                                  )
                                                )}
                                              </tr>
                                            ))}
                                        </tbody>
                                      </table>
                                      {message.results.length > 10 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 px-4">
                                          Showing 10 of {message.results.length}{" "}
                                          rows
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}

                              {/* Metadata */}
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                {message.rowCount !== undefined && (
                                  <span>{message.rowCount} rows</span>
                                )}
                                {message.executionTime && (
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {message.executionTime}ms
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Analyzing your data...
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input - Fixed at bottom */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <form onSubmit={handleSubmit} className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your data..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
