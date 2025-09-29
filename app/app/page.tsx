// app/app/page.tsx
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
}

export default function ChatInterface() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConnections();
    }
  }, [status]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConnection || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: selectedConnection,
          question: input,
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

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "Failed to process your query. Please try again.",
        error: "Network error",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Database Analyst
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ask questions about your data in plain English
              </p>
            </div>

            {/* Connection Selector */}
            <div className="flex items-center space-x-3">
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
              <button
                onClick={() => router.push("/connections")}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Manage Connections"
              >
                <Database className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
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
                              {/* Data Visualization */}
                              <DataVisualization data={message.results} />

                              {/* Results Table */}
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                  <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                      {Object.keys(message.results[0]).map(
                                        (key) => (
                                          <th
                                            key={key}
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                                          >
                                            {key}
                                          </th>
                                        )
                                      )}
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
                                    Showing 10 of {message.results.length} rows
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

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
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
  );
}
