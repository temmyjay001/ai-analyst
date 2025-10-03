// app/(dashboard)/q/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import AppNav from "@/components/AppNav";
import { ChatMessage as ChatMessageType } from "@/types/chatSession";

interface SessionData {
  id: string;
  title: string;
  plan: string;
  isMultiTurn: boolean;
  connectionId: string;
}

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [error, setError] = useState("");
  const [canContinue, setCanContinue] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      const response = await fetch(`/api/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Session not found");
        } else {
          setError("Failed to load session");
        }
        return;
      }

      const data = await response.json();
      setSession(data.session);
      setMessages(data.messages);
      setCanContinue(data.session.isMultiTurn);
    } catch (err) {
      console.error("Failed to fetch session:", err);
      setError("Failed to load session");
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || loading || !session) return;

    const userQuestion = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessageType = {
      id: `temp-${Date.now()}`,
      userId: "",
      connectionId: session.connectionId,
      sessionId: sessionId,
      role: "user",
      messageIndex: messages.length,
      question: userQuestion,
      isFavorite: false,
      isShared: false,
      fromCache: false,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          connectionId: session.connectionId,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.upgradeRequired) {
          setError(
            "Multi-turn conversations require Growth plan or higher. Please upgrade to continue."
          );
        } else if (data.limitReached) {
          setError(data.error);
        } else {
          setError(data.error || "Failed to execute query");
        }
        // Remove optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
        return;
      }

      // Add assistant response
      const assistantMessage: ChatMessageType = {
        id: data.message.id,
        userId: data.message.userId,
        connectionId: session.connectionId,
        sessionId: sessionId,
        role: "assistant",
        messageIndex: messages.length + 1,
        sqlGenerated: data.sql,
        results: data.results,
        interpretation: data.interpretation,
        executionTimeMs: data.executionTime,
        rowCount: data.rowCount,
        isFavorite: false,
        isShared: false,
        fromCache: false,
        createdAt: new Date(),
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        tempUserMessage,
        assistantMessage,
      ]);
      setCanContinue(data.canContinue);
    } catch (err) {
      console.error("Query error:", err);
      setError("Failed to execute query");
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuery = () => {
    router.push("/app");
  };

  if (loadingSession) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AppNav />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <AppNav />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push("/app")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <AppNav />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/app")}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {session?.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {messages.filter((m) => m.role === "user").length}{" "}
                  {messages.filter((m) => m.role === "user").length === 1
                    ? "query"
                    : "queries"}
                </p>
              </div>
            </div>
            <button
              onClick={handleNewQuery}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Query</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                connectionId={session?.connectionId}
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
        </div>

        {/* Input Area */}
        {canContinue ? (
          <ChatInput
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            disabled={false}
          />
        ) : (
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  💬 <strong>Want to ask follow-up questions?</strong> Upgrade
                  to Growth for multi-turn conversations
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push("/billing")}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    Upgrade to Growth
                  </button>
                  <button
                    onClick={handleNewQuery}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    Start New Query
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
