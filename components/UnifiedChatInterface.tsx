// components/UnifiedChatInterface.tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Database, Loader2, Plus, Menu } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import EmptyState from "@/components/EmptyState";
import QueryHistorySidebar from "@/components/QueryHistorySidebar";
import { useQueryHistory } from "@/hooks/useQueryHistory";
import { DatabaseConnection } from "@/types/connection";
import { ChatMessage as ChatMessageType } from "@/types/chatSession";

interface SessionData {
  id: string;
  title: string;
  plan: string;
  isMultiTurn: boolean;
  connectionId: string;
}

interface UnifiedChatInterfaceProps {
  sessionId?: string;
}

export default function UnifiedChatInterface({
  sessionId,
}: Readonly<UnifiedChatInterfaceProps>) {
  const router = useRouter();

  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState("");

  const [currentSession, setCurrentSession] = useState<SessionData | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [canContinue, setCanContinue] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      setCurrentSession(null);
      setMessages([]);
      setCanContinue(false);
      setError("");
    }
  }, [sessionId]);

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

  const loadSession = async (sid: string) => {
    try {
      setLoadingSession(true);
      setError("");

      const response = await fetch(`/api/sessions/${sid}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Session not found");
        } else {
          setError("Failed to load session");
        }
        setCurrentSession(null);
        setMessages([]);
        return;
      }

      const data = await response.json();
      setCurrentSession(data.session);
      setMessages(data.messages);
      setCanContinue(data.session.isMultiTurn);
      setSelectedConnection(data.session.connectionId);
    } catch (err) {
      console.error("Failed to load session:", err);
      setError("Failed to load session");
      setCurrentSession(null);
      setMessages([]);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSubmit = async (e: FormEvent, questionOverride?: string) => {
    e.preventDefault();

    const question = questionOverride || input.trim();
    if (!question || loading || !selectedConnection) return;

    setInput("");
    setLoading(true);
    setError("");

    // Only add optimistic user message if continuing an existing session
    let tempUserMessage: ChatMessageType | null = null;
    if (sessionId && currentSession) {
      tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        userId: "",
        connectionId: selectedConnection,
        sessionId: sessionId,
        role: "user",
        messageIndex: messages.length,
        question: question,
        isFavorite: false,
        isShared: false,
        fromCache: false,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, tempUserMessage!]);
    }

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          connectionId: selectedConnection,
          sessionId: sessionId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (tempUserMessage) {
          setMessages((prev) =>
            prev.filter((m) => m.id !== tempUserMessage!.id)
          );
        }

        if (data.error) {
          setError(data.error);
        } else {
          setError("Failed to execute query");
        }
        return;
      }

      // Handle successful response
      if (!sessionId && data.sessionId) {
        // New chat - navigate to the new session URL
        router.push(`/app/${data.sessionId}`);
        await refetchHistory();
      } else if (sessionId && tempUserMessage && data.message) {
        // Continuing existing session
        const assistantMessage: ChatMessageType = {
          id: data.message.id,
          userId: data.message.userId,
          connectionId: selectedConnection,
          sessionId: sessionId,
          role: "assistant",
          messageIndex: data.message.messageIndex,
          sqlGenerated: data.sql,
          results: data.results,
          interpretation: data.interpretation,
          executionTimeMs: data.executionTime,
          rowCount: data.rowCount,
          isFavorite: false,
          isShared: false,
          fromCache: false,
          createdAt: new Date(data.message.createdAt),
        };

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUserMessage!.id);
          const userMessage: ChatMessageType = {
            id: `user-${data.message.messageIndex - 1}`,
            userId: data.message.userId,
            connectionId: selectedConnection,
            sessionId: sessionId,
            role: "user",
            messageIndex: data.message.messageIndex - 1,
            question: question,
            isFavorite: false,
            isShared: false,
            fromCache: false,
            createdAt: new Date(),
          };
          return [...withoutTemp, userMessage, assistantMessage];
        });

        setCanContinue(data.canContinue);
        await refetchHistory();
      }
    } catch (error) {
      console.error("Query error:", error);
      setError("Failed to execute query. Please try again.");
      if (tempUserMessage) {
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage!.id));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryItemClick = (sid: string) => {
    router.push(`/app/${sid}`);
  };

  const handleNewChat = () => {
    router.push("/app");
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
    <div className="flex-1 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <QueryHistorySidebar
        history={history}
        loading={loadingHistory}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleFavorite={toggleFavorite}
        onDeleteQuery={deleteQuery}
        onHistoryItemClick={handleHistoryItemClick}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-4 flex-1 md:flex-none">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <select
                  value={selectedConnection}
                  onChange={(e) => setSelectedConnection(e.target.value)}
                  disabled={!!sessionId}
                  className="text-sm font-medium text-gray-900 dark:text-white bg-transparent border-0 focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name}
                    </option>
                  ))}
                </select>
              </div>

              {currentSession && (
                <div className="hidden md:block">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentSession.title}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleNewChat}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingSession ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              onSelectQuery={(suggestion) => {
                setInput(suggestion);
              }}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  connectionId={selectedConnection}
                  sessionId={sessionId}
                />
              ))}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                  {error.includes("upgrade") && (
                    <button
                      onClick={() => router.push("/billing")}
                      className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      View Pricing Plans
                    </button>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="max-w-4xl mx-auto">
            {sessionId && !canContinue ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Multi-turn conversations require Growth plan or higher
                </p>
                <button
                  onClick={() => router.push("/billing")}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Upgrade to continue conversation
                </button>
              </div>
            ) : (
              <ChatInput
                input={input}
                onInputChange={setInput}
                onSubmit={handleSubmit}
                loading={loading}
                placeholder={
                  sessionId
                    ? "Ask a follow-up question..."
                    : "Ask a question about your database..."
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
