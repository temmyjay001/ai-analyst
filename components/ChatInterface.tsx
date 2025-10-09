// components/ChatInterface.tsx - Complete Clean Refactor
"use client";

import { useState, useEffect, useRef, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Brain, Crown } from "lucide-react";
import { useChatStream } from "@/hooks/useChatStream";
import { useDeepAnalysisStream } from "@/hooks/useDeepAnalysisStream";
import UnifiedMessage from "./UnifiedMessage";
import { ChatMessage, ChatSession } from "@/types/chat";
import EmptyState from "./EmptyState";
import ChatInput from "./ChatInput";
import { useUserStore } from "@/store/userStore";
import { MULTI_TURN_PLANS } from "@/lib/constants";
import { BillingUpgrade } from "./BillingUpgrade";

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
  const [creatingSession, setCreatingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track streaming message IDs
  const streamingUserMsgId = useRef<string | null>(null);
  const streamingAssistantMsgId = useRef<string | null>(null);

  const userPlan = useUserStore((state) => state.plan);

  // Chat streaming
  const {
    streaming,
    status,
    sql,
    interpretation,
    results,
    suggestions,
    error: streamError,
    showError,
    isInformational,
    streamChat,
    clearError,
  } = useChatStream({
    onUserMessageSaved: (data) => {
      // Replace temp user message with real saved one
      if (data.message && streamingUserMsgId.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingUserMsgId.current ? data.message : msg
          )
        );
      }
    },
    onComplete: (data) => {
      // Replace streaming assistant message with saved one
      if (data.message && streamingAssistantMsgId.current) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === streamingAssistantMsgId.current ? data.message : msg
          )
        );

        // Clear streaming refs
        streamingUserMsgId.current = null;
        streamingAssistantMsgId.current = null;

        // Update session message count
        if (session) {
          setSession({
            ...session,
            messageCount: (session.messageCount || 0) + 2,
            updatedAt: new Date(),
          });
        }
      }

      // Trigger sidebar refresh
      window.dispatchEvent(
        new CustomEvent("session-updated", {
          detail: { sessionId: data.sessionId },
        })
      );
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
    showError: showDeepError,
    clearError: clearDeepError,
    streamDeepAnalysis,
  } = useDeepAnalysisStream({
    onComplete: () => {
      window.dispatchEvent(
        new CustomEvent("session-updated", {
          detail: { sessionId },
        })
      );

      if (sessionId) {
        loadSession(sessionId);
      }
    },
  });

  // Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  // Handle session changes - THE KEY LOGIC
  useEffect(() => {
    if (!sessionId) {
      // No session - show empty state
      setSession(null);
      setMessages([]);
      return;
    }

    // Check if this is a brand new session with a pending first message
    const newMessageData = sessionStorage.getItem("newMessage");

    if (newMessageData) {
      // This is a brand new session - DON'T load from database
      sessionStorage.removeItem("newMessage");

      const { question, connectionId } = JSON.parse(newMessageData);

      // Set session info (we know the ID already)
      setSession({
        id: sessionId,
        title: question.substring(0, 100),
        connectionId: connectionId,
        messageCount: 0,
      } as ChatSession);

      // Add optimistic messages
      const timestamp = Date.now();
      const userMsgId = `temp-user-${timestamp}`;
      const assistantMsgId = `temp-assistant-${timestamp}`;

      streamingUserMsgId.current = userMsgId;
      streamingAssistantMsgId.current = assistantMsgId;

      const tempUserMessage: ChatMessage = {
        id: userMsgId,
        sessionId: sessionId,
        role: "user",
        content: question,
        createdAt: new Date(),
      } as ChatMessage;

      const tempAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        sessionId: sessionId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        metadata: {
          isStreaming: true,
        },
      } as ChatMessage;

      setMessages([tempUserMessage, tempAssistantMessage]);

      // Start streaming
      streamChat(question, connectionId, sessionId);
    } else {
      // Normal session load from database
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Auto-scroll
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

  const createNewSession = async (
    connectionId: string,
    firstQuestion: string
  ): Promise<string | null> => {
    try {
      setCreatingSession(true);
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          title: firstQuestion.substring(0, 100),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      return data.session.id;
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    } finally {
      setCreatingSession(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !selectedConnection || streaming || creatingSession) {
      return;
    }

    const question = input.trim();
    setInput("");
    clearError();

    if (!sessionId) {
      // NEW SESSION FLOW
      // 1. Create session
      const newSessionId = await createNewSession(selectedConnection, question);

      if (!newSessionId) {
        alert("Failed to create session. Please try again.");
        return;
      }

      // 2. Store question for new page to pick up
      sessionStorage.setItem(
        "newMessage",
        JSON.stringify({
          question,
          connectionId: selectedConnection,
        })
      );

      // 3. Navigate immediately
      router.push(`/app/${newSessionId}`);
    } else {
      // EXISTING SESSION FLOW
      const timestamp = Date.now();
      const userMsgId = `temp-user-${timestamp}`;
      const assistantMsgId = `temp-assistant-${timestamp}`;

      streamingUserMsgId.current = userMsgId;
      streamingAssistantMsgId.current = assistantMsgId;

      const tempUserMessage: ChatMessage = {
        id: userMsgId,
        sessionId: sessionId,
        role: "user",
        content: question,
        createdAt: new Date(),
      } as ChatMessage;

      const tempAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        sessionId: sessionId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        metadata: {
          isStreaming: true,
        },
      } as ChatMessage;

      setMessages((prev) => [...prev, tempUserMessage, tempAssistantMessage]);

      // Stream immediately
      await streamChat(question, selectedConnection, sessionId);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
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

  const handleRetrySuccess = useCallback(
    (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, newMessage]);

      window.dispatchEvent(
        new CustomEvent("session-updated", {
          detail: { sessionId },
        })
      );

      scrollToBottom();
    },
    [sessionId]
  );

  const canShowSuggestions = MULTI_TURN_PLANS.includes(userPlan);

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

          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            disabled={streaming || deepAnalyzing}
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

        {/* Render all messages */}
        {messages.map((message, index) => {
          let userQuestion = "";
          if (message.role === "assistant") {
            for (let i = index - 1; i >= 0; i--) {
              if (messages[i].role === "user") {
                userQuestion = messages[i].content;
                break;
              }
            }
          }

          const isStreamingMessage =
            message.id === streamingAssistantMsgId.current && streaming;

          return (
            <UnifiedMessage
              key={message.id}
              message={message}
              userQuestion={userQuestion}
              session={session ?? undefined}
              isStreaming={isStreamingMessage}
              status={isStreamingMessage ? status : undefined}
              streamingSql={isStreamingMessage ? sql : undefined}
              streamingInterpretation={
                isStreamingMessage ? interpretation : undefined
              }
              streamingResults={isStreamingMessage ? results : undefined}
              streamingSuggestions={
                isStreamingMessage ? suggestions : undefined
              }
              error={isStreamingMessage ? streamError : undefined}
              onDismissError={isStreamingMessage ? clearError : undefined}
              onDeepAnalysis={
                message.role === "assistant" && message.metadata?.results
                  ? () => {
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
              onRetrySuccess={handleRetrySuccess}
              onSuggestionClick={handleSuggestionClick}
              canShowSuggestions={canShowSuggestions}
            />
          );
        })}

        {/* Deep Analysis Streaming */}
        {(deepAnalyzing || showDeepError) && (
          <div
            className={`rounded-lg p-4 border ${
              deepError
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
            }`}
          >
            <div className="flex items-start gap-3">
              <Brain
                className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  deepError ? "text-red-600" : "text-purple-600 animate-pulse"
                }`}
              />
              {deepError ? (
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                    {deepError.upgradeRequired
                      ? "Deep Analysis Requires Upgrade"
                      : "Deep Analysis Error"}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                    {deepError.message}
                  </p>

                  {deepError.upgradeRequired && (
                    <div className="flex items-center gap-2">
                      <BillingUpgrade variant="default" size="sm">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to {deepError.requiredPlan}
                      </BillingUpgrade>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        You have {deepError.queriesAvailable} queries remaining
                        today.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1">
                  <p className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                    Deep Analysis in Progress
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                    {deepStatus}
                  </p>

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
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        input={input}
        loading={streaming || deepAnalyzing}
        onInputChange={(value) => setInput(value)}
        onSubmit={handleSubmit}
        disabled={streaming || deepAnalyzing || !selectedConnection}
        placeholder={
          selectedConnection
            ? "Ask a question about your data..."
            : "Select a database connection first"
        }
      />
    </div>
  );
}
