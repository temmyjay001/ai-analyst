"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Plus, Menu } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";
import QueryHistorySidebar from "@/components/QueryHistorySidebar";
import { useChatSession } from "@/hooks/useChatSession";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import { DatabaseConnection } from "@/types/connection";
import { Message } from "@/types/message";
import { QueryHistoryItem } from "@/types/history";

export default function ChatInterface() {
  const router = useRouter();

  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    messages,
    messagesEndRef,
    scrollToBottom,
    saveCurrentSession,
    startNewChat,
    updateMessages,
  } = useChatSession();

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
    const questionToSubmit = questionOverride || input;

    if (!questionToSubmit.trim() || !selectedConnection || loading) return;

    saveCurrentSession();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: questionToSubmit,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    updateMessages(updatedMessages);
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
      updateMessages(finalMessages);

      if (data.success) {
        refetchHistory();
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "Failed to process your query. Please try again.",
        error: "Network error",
        timestamp: new Date(),
      };
      updateMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const rerunQuery = (historyItem: QueryHistoryItem) => {
    const newMessages: Message[] = [];

    if (historyItem.results && historyItem.results.length > 0) {
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
        fromHistory: true,
      };

      newMessages.push(userMessage, assistantMessage);
      startNewChat(newMessages);
      setTimeout(scrollToBottom, 100);
    } else if (historyItem.error) {
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

      newMessages.push(userMessage, errorMessage);
      startNewChat(newMessages);
      setTimeout(scrollToBottom, 100);
    } else {
      startNewChat();
      setInput(historyItem.question);
      setTimeout(() => {
        handleSubmit(new Event("submit") as any, historyItem.question);
      }, 100);
    }
  };

  const rerunQueryFresh = (historyItem: QueryHistoryItem) => {
    startNewChat();
    setInput(historyItem.question);
    setTimeout(() => {
      handleSubmit(new Event("submit") as any, historyItem.question);
    }, 100);
  };

  if (loadingConnections) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (connections.length === 0) {
    return (
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
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <QueryHistorySidebar
        show={showSidebar}
        history={history}
        loading={loadingHistory}
        onClose={() => setShowSidebar(false)}
        onRerunQuery={rerunQuery}
        onRerunFresh={rerunQueryFresh}
        onToggleFavorite={toggleFavorite}
        onDeleteQuery={deleteQuery}
      />

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
                    <button
                      onClick={() => startNewChat()}
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

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {messages.length === 0 ? (
              <EmptyState
                onSelectQuery={(query) => {
                  setInput(query);
                  setTimeout(() => {
                    handleSubmit(new Event("submit") as any, query);
                  }, 100);
                }}
              />
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  connectionId={selectedConnection}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

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
