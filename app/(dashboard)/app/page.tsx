// app/(dashboard)/app/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Plus, Menu } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";
import QueryHistorySidebar from "@/components/QueryHistorySidebar";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import { DatabaseConnection } from "@/types/connection";

export default function ChatInterface() {
  const router = useRouter();

  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    history,
    loading: loadingHistory,
    fetchHistory,
    refetchHistory,
    toggleFavorite,
    deleteQuery,
  } = useQueryHistory();

  useEffect(() => {
    fetchConnections();
    fetchHistory();
  }, [fetchHistory]);

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

  const handleSubmit = async (e: FormEvent, questionOverride?: string) => {
    e.preventDefault();

    const question = questionOverride || input.trim();
    if (!question || loading || !selectedConnection) return;

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          connectionId: selectedConnection,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Query failed:", data.error);
        // Show error to user
        alert(data.error || "Failed to execute query");
        return;
      }

      // Redirect to the session page
      if (data.sessionId) {
        router.push(`/q/${data.sessionId}`);
      }

      // Refresh history
      await refetchHistory();
    } catch (error) {
      console.error("Query error:", error);
      alert("Failed to execute query");
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemClick = (sessionId: string) => {
    router.push(`/q/${sessionId}`);
  };

  if (loadingConnections) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Database className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          No Database Connections
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
          Get started by connecting your first database
        </p>
        <button
          onClick={() => router.push("/connections")}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          Add Connection
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <QueryHistorySidebar
        history={history}
        loading={loadingHistory}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleFavorite={toggleFavorite}
        onDeleteQuery={deleteQuery}
        onHistoryItemClick={handleHistoryItemClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-4 flex-1 md:flex-none">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Ask Questions
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ask questions about your data in plain English
                  </p>
                </div>
              </div>

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

        {/* Empty State */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <EmptyState
              onSelectQuery={(query) => {
                setInput(query);
                setTimeout(() => {
                  handleSubmit(new Event("submit") as any, query);
                }, 100);
              }}
            />
          </div>
        </div>

        {/* Input */}
        <ChatInput
          input={input}
          loading={loading}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          disabled={!selectedConnection}
        />
      </div>
    </div>
  );
}
