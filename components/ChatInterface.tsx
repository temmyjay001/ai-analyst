// components/ChatInterface.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  AlertCircle,
  Sparkles,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Import custom hooks
import { useChatStream } from "@/hooks/useChatStream";
import { useDeepAnalysisStream } from "@/hooks/useDeepAnalysisStream";
import { useChatSession } from "@/hooks/useChatSession";
import { useUserStore } from "@/store/userStore";

// Import components
import DataVisualization from "@/components/DataVisualization";
import ResultsTable from "@/components/ResultsTable";
import { BillingUpgrade } from "@/components/BillingUpgrade";

// Types
import { ChatMessage, MessageRole } from "@/types/chat";
import { MULTI_TURN_PLANS } from "@/lib/constants";
import { Markdown } from "./Markdown";

interface ChatInterfaceProps {
  sessionId?: string;
  connectionId: string;
}

export default function ChatInterface({
  sessionId: initialSessionId,
  connectionId,
}: ChatInterfaceProps) {
  // Store hooks
  const { plan } = useUserStore();
  const canUseMultiTurn = MULTI_TURN_PLANS.includes(plan);
  const canUseDeepAnalysis = ["growth", "enterprise"].includes(plan);

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State
  const [input, setInput] = useState("");
  const [showVisualization, setShowVisualization] = useState(true);

  // Session management
  const {
    session,
    messages,
    loading: sessionLoading,
    createSession,
    addMessage,
    updateLastMessage,
    clearSession,
  } = useChatSession({ initialSessionId, connectionId });

  // Streaming hooks
  const chatStream = useChatStream({
    onComplete: (data) => {
      if (data.message) {
        addMessage(data.message);
      }
      scrollToBottom();
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSessionCreated: (sessionId) => {
      createSession(sessionId, input.substring(0, 100));
    },
  });

  const deepAnalysis = useDeepAnalysisStream({
    onComplete: (data) => {
      toast.success("Deep analysis completed!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatStream.streaming]);

  // Handle input submission
  const handleSubmit = useCallback(async () => {
    if (!input.trim() || chatStream.streaming) return;

    const question = input.trim();
    setInput("");

    // Check multi-turn capability
    if (session && !canUseMultiTurn) {
      toast.error("Multi-turn conversations require Growth plan or higher");
      return;
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: session?.id || "",
      role: "user" as MessageRole,
      content: question,
      createdAt: new Date(),
    };
    addMessage(userMessage);

    // Start streaming
    await chatStream.streamChat(question, connectionId, session?.id);
  }, [input, chatStream, session, connectionId, canUseMultiTurn, addMessage]);

  // Handle deep analysis
  const handleDeepAnalysis = useCallback(async () => {
    if (!canUseDeepAnalysis) {
      toast.error("Deep Analysis requires Growth plan or higher");
      return;
    }

    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find(
        (m) => m.role === "assistant" && m.metadata?.sql && m.metadata?.results
      );

    if (!lastAssistantMessage?.metadata) {
      toast.error("No query results to analyze");
      return;
    }

    if (!session?.id) {
      toast.error("Session required for deep analysis");
      return;
    }

    await deepAnalysis.streamDeepAnalysis(
      lastAssistantMessage.content,
      lastAssistantMessage.metadata.sql as string,
      lastAssistantMessage.metadata.results as any[],
      connectionId,
      session.id
    );
  }, [canUseDeepAnalysis, messages, session, connectionId, deepAnalysis]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Check if connection is provided
  if (!connectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-center mb-2">
            No Database Connection
          </h3>
          <p className="text-center text-gray-500 mb-4">
            Please select a database connection to start querying your data.
          </p>
          <Button
            onClick={() => (window.location.href = "/connections")}
            className="w-full"
          >
            Manage Connections
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4 pb-4">
          {messages.length === 0 && !chatStream.streaming && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Ask questions about your data and I&apos;ll help you explore it
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <Card
                className={cn(
                  "max-w-[80%] p-4",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "assistant" && message.metadata?.sql && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">SQL Query</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(message.metadata!.sql!);
                          toast.success("SQL copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <pre className="text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
                      <code>{message.metadata.sql}</code>
                    </pre>
                  </div>
                )}

                <div className="whitespace-pre-wrap">
                  <Markdown content={message.content}></Markdown>
                </div>

                {message.metadata?.results &&
                  message.metadata.results.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">
                          {message.metadata.results.length} results
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setShowVisualization(!showVisualization)
                            }
                          >
                            {showVisualization ? "Show Table" : "Show Chart"}
                          </Button>
                          {canUseDeepAnalysis && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleDeepAnalysis}
                              disabled={deepAnalysis.streaming}
                            >
                              Deep Analysis
                            </Button>
                          )}
                        </div>
                      </div>

                      {showVisualization ? (
                        <DataVisualization
                          data={message.metadata.results}
                          chartMetadata={{
                            question: messages[index - 1]?.content || "",
                            sql: message.metadata.sql || "",
                            connectionId,
                            sessionId: session?.id,
                            messageId: message.id,
                          }}
                        />
                      ) : (
                        <ResultsTable data={message.metadata.results} />
                      )}
                    </div>
                  )}

                {message.metadata?.suggestions &&
                  message.metadata.suggestions.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-semibold">
                        Suggested follow-ups:
                      </p>
                      {message.metadata.suggestions.map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          className="mr-2 mb-2"
                          onClick={() => setInput(suggestion)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
              </Card>
            </div>
          ))}

          {/* Streaming Message */}
          {chatStream.streaming && (
            <div className="flex gap-3 justify-start">
              <Card className="max-w-[80%] p-4 bg-muted">
                {chatStream.status && (
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">
                      {chatStream.status.message}
                    </span>
                  </div>
                )}

                {chatStream.sql && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2">
                      SQL Query
                    </Badge>
                    <pre className="text-xs bg-black/10 dark:bg-white/10 p-2 rounded overflow-x-auto">
                      <code>{chatStream.sql}</code>
                    </pre>
                  </div>
                )}

                {chatStream.results && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="mb-2">
                      {chatStream.results.length} results
                    </Badge>
                    {showVisualization ? (
                      <DataVisualization data={chatStream.results} />
                    ) : (
                      <ResultsTable data={chatStream.results} />
                    )}
                  </div>
                )}

                {chatStream.interpretation && (
                  <div className="whitespace-pre-wrap">
                    <Markdown content={chatStream.interpretation}></Markdown>
                  </div>
                )}

                {!chatStream.sql && !chatStream.interpretation && (
                  <div className="flex gap-1">
                    <span className="animate-pulse">●</span>
                    <span className="animate-pulse animation-delay-200">●</span>
                    <span className="animate-pulse animation-delay-400">●</span>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Deep Analysis Streaming */}
          {deepAnalysis.streaming && (
            <div className="flex gap-3 justify-start">
              <Card className="max-w-[80%] p-4 bg-muted">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 animate-pulse text-purple-600" />
                  <span className="font-semibold">Deep Analysis</span>
                  {deepAnalysis.status && (
                    <span className="text-sm text-gray-500">
                      - {deepAnalysis.status}
                    </span>
                  )}
                </div>

                {deepAnalysis.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="mb-4 p-3 bg-background rounded"
                  >
                    <div className="font-medium mb-1">
                      Step {step.stepNumber}: {step.question}
                    </div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                      {step.insights}
                    </div>
                  </div>
                ))}

                {deepAnalysis.comprehensiveInsights && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded">
                    <div className="font-medium mb-2">
                      Comprehensive Insights
                    </div>
                    <div className="whitespace-pre-wrap">
                      {deepAnalysis.comprehensiveInsights}
                    </div>
                  </div>
                )}

                {deepAnalysis.currentStep > 0 &&
                  !deepAnalysis.comprehensiveInsights && (
                    <div className="text-sm text-gray-500">
                      Analyzing step {deepAnalysis.currentStep} of 3...
                    </div>
                  )}
              </Card>
            </div>
          )}

          {/* Error Display */}
          {(chatStream.showError || deepAnalysis.showError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {chatStream.error?.message || deepAnalysis.error?.message}
                </span>
                <div className="flex gap-2">
                  {(chatStream.error?.upgradeRequired ||
                    deepAnalysis.error?.upgradeRequired) && (
                    <BillingUpgrade variant="outline" size="sm">
                      Upgrade
                    </BillingUpgrade>
                  )}
                  {chatStream.error?.canRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        chatStream.retry(input, connectionId, session?.id)
                      }
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      chatStream.clearError();
                      deepAnalysis.clearError();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <Separator />

      {/* Input Area */}
      <div className="p-4 bg-background">
        <div className="max-w-4xl mx-auto">
          {session && !canUseMultiTurn && (
            <Alert className="mb-3">
              <AlertDescription>
                Multi-turn conversations require Growth plan or higher.
                <BillingUpgrade className="ml-2 text-primary hover:underline">
                  Upgrade to continue
                </BillingUpgrade>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your data..."
              disabled={chatStream.streaming || deepAnalysis.streaming}
              className="flex-1 min-h-[48px] max-h-[200px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSubmit}
              disabled={
                !input.trim() || chatStream.streaming || deepAnalysis.streaming
              }
              size="icon"
              className="h-12 w-12"
            >
              {chatStream.streaming || deepAnalysis.streaming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div>
              {canUseMultiTurn ? (
                <span>Multi-turn enabled</span>
              ) : (
                <span>Single query mode</span>
              )}
            </div>
            <div>
              Press{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                ⌘
              </kbd>{" "}
              +{" "}
              <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                Enter
              </kbd>{" "}
              to send
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
