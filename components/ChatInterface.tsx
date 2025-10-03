// components/ChatInterface.tsx (updated)

"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Brain } from "lucide-react";
import { useChatStream } from "@/hooks/useChatStream";
import { useDeepAnalysisStream } from "@/hooks/useDeepAnalysisStream";
import ChatMessageComponent from "./ChatMessage";
import StreamingMessage from "./StreamingMessage";
import { ChatMessage, ChatSession } from "@/types/chat";
import EmptyState from "./EmptyState";

interface ChatInterfaceProps {
  sessionId?: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string>("");
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat streaming
  const {
    streaming,
    status,
    sql,
    interpretation,
    results,
    error: streamError,
    streamChat,
  } = useChatStream({
    onComplete: (data) => {
      // Navigate to new session if created
      if (!sessionId && data.sessionId) {
        router.push(`/app/${data.sessionId}`);
      }
      // Reload messages
      if (data.sessionId) {
        loadSession(data.sessionId);
      }
    },
    onError: (error) => {
      console.error("Stream error:", error);
    },
  });

  // Deep analysis streaming
  const {
    streaming: deepAnalyzing,
    currentStep,
    steps: deepSteps,
    status: deepStatus,
    error: deepError,
    streamDeepAnalysis,
  } = useDeepAnalysisStream({
    onComplete: () => {
      // Reload session after deep analysis
      if (sessionId) {
        loadSession(sessionId);
      }
    },
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    } else {
      // Clear state for new chat
      setSession(null);
      setMessages([]);
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streaming]);

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
    }
  };

  const loadSession = async (sid: string) => {
    try {
      setLoadingSession(true);
      const response = await fetch(`/api/sessions/${sid}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
        setMessages(data.messages);
        setSelectedConnection(data.session.connectionId);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoadingSession(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !selectedConnection || streaming) {
      return;
    }

    const question = input.trim();
    setInput("");

    // Start streaming
    await streamChat(question, selectedConnection, sessionId);
  };

  const handleDeepAnalysis = async (
    question: string,
    sql: string,
    results: any[]
  ) => {
    if (!sessionId || deepAnalyzing) return;

    await streamDeepAnalysis(
      question,
      sql,
      results,
      selectedConnection,
      sessionId
    );
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {session?.title || "New Chat"}
          </h1>

          {/* Connection Selector */}
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            disabled={!!sessionId || streaming}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!messages.length && !streaming && !deepAnalyzing && (
          <EmptyState
            onSelectQuery={(suggestion) => {
              setInput(suggestion);
            }}
          />
        )}
        {messages.map((message) => (
          <ChatMessageComponent
            key={message.id}
            message={message}
            onDeepAnalysis={
              message.role === "assistant" && message.metadata?.results
                ? () => {
                    // Find previous user message
                    const userMsg = messages.find(
                      (m) =>
                        m.role === "user" && m.createdAt < message.createdAt
                    );
                    handleDeepAnalysis(
                      userMsg?.content || "",
                      message.metadata!.sql!,
                      message.metadata!.results!
                    );
                  }
                : undefined
            }
          />
        ))}

        {/* Streaming Message */}
        {streaming && (
          <StreamingMessage
            status={status}
            sql={sql}
            interpretation={interpretation}
            results={results}
            error={streamError}
          />
        )}

        {/* Deep Analysis Streaming */}
        {deepAnalyzing && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Brain className="h-5 w-5 text-purple-600 animate-pulse mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Deep Analysis in Progress
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                  {deepStatus}
                </p>

                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-2 rounded-full ${
                        step <= currentStep
                          ? "bg-purple-600"
                          : "bg-purple-200 dark:bg-purple-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Completed Steps */}
                {deepSteps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="mb-2 p-2 bg-white dark:bg-gray-800 rounded"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {step.question}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {step.insights}
                    </p>
                  </div>
                ))}

                {deepError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    {deepError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming || deepAnalyzing || !selectedConnection}
            placeholder={
              selectedConnection
                ? "Ask a question about your data..."
                : "Select a database connection first"
            }
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={
              !input.trim() || streaming || deepAnalyzing || !selectedConnection
            }
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {streaming || deepAnalyzing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
