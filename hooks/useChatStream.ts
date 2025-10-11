// hooks/useChatStream.ts
import { useState, useCallback, useRef } from "react";
import { StreamError, StreamStatus, MessageMetadata } from "@/types/chat";

interface UseChatStreamOptions {
  onComplete?: (data: any) => void;
  onError?: (error: StreamError) => void;
  onSessionCreated?: (sessionId: string) => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [sqlChunks, setSqlChunks] = useState<string[]>([]);
  const [interpretationChunks, setInterpretationChunks] = useState<string[]>(
    []
  );
  const [results, setResults] = useState<any[] | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<StreamError | null>(null);
  const [showError, setShowError] = useState(false);
  const [isInformational, setIsInformational] = useState(false);
  const [metadata, setMetadata] = useState<MessageMetadata | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamChat = useCallback(
    async (question: string, connectionId: string, sessionId?: string) => {
      // Reset state
      setStreaming(true);
      setStatus(null);
      setSqlChunks([]);
      setInterpretationChunks([]);
      setResults(null);
      setSuggestions([]);
      setError(null);
      setShowError(false);
      setIsInformational(false);
      setMetadata(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, connectionId, sessionId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to start stream");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;

            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              const data = JSON.parse(dataMatch[1]);

              handleSSEEvent(eventType, data);
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Stream aborted");
        } else {
          console.error("Stream error:", err);
          const streamError: StreamError = {
            message: err.message || String(err),
            canRetry: true,
          };
          setError(streamError);
          setShowError(true);
          options.onError?.(streamError);
        }
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  const handleSSEEvent = useCallback(
    (eventType: string, data: any) => {
      switch (eventType) {
        case "status":
          setStatus(data);
          break;

        case "session_created":
          options.onSessionCreated?.(data.sessionId);
          break;

        case "user_message":
          // User message saved
          break;

        case "sql_chunk":
          setSqlChunks((prev) => [...prev, data.chunk]);
          break;

        case "sql_generated":
          // SQL generation complete
          setMetadata((prev) => ({ ...prev, sql: sqlChunks.join("") }));
          break;

        case "sql_executing":
          setStatus({ stage: "executing", message: "Executing query..." });
          break;

        case "results":
          setResults(data.results);
          setMetadata((prev) => ({
            ...prev,
            rowCount: data.rowCount,
            executionTimeMs: data.executionTimeMs,
          }));
          break;

        case "interpretation_start":
          setInterpretationChunks([]);
          setStatus({ stage: "interpreting", message: "Analyzing results..." });
          break;

        case "interpretation_chunk":
          setInterpretationChunks((prev) => [...prev, data.chunk]);
          break;

        case "interpretation_complete":
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
          break;

        case "suggestions":
          setSuggestions(data.suggestions || []);
          break;

        case "informational_message":
          setIsInformational(true);
          setInterpretationChunks([data.message]);
          break;

        case "cached_result":
          setSqlChunks([data.sql]);
          setInterpretationChunks([data.interpretation]);
          setResults(data.results);
          if (data.suggestions) {
            setSuggestions(data.suggestions);
          }
          setMetadata({
            fromCache: true,
            cacheKey: data.cacheKey,
            sql: data.sql,
            rowCount: data.results?.length,
          });
          break;

        case "complete":
          setStatus({ stage: "complete", message: "Query completed" });
          options.onComplete?.(data);
          break;

        case "error":
          setError(data as StreamError);
          setShowError(true);
          setStreaming(false);
          setStatus({ stage: "error", message: data.message });
          options.onError?.(data as StreamError);
          break;
      }
    },
    [options, sqlChunks]
  );

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
      setStatus(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setShowError(false);
  }, []);

  const retry = useCallback(
    (question: string, connectionId: string, sessionId?: string) => {
      clearError();
      return streamChat(question, connectionId, sessionId);
    },
    [streamChat, clearError]
  );

  return {
    // State
    streaming,
    status,
    sql: sqlChunks.join(""),
    interpretation: interpretationChunks.join(""),
    results,
    suggestions,
    error,
    showError,
    isInformational,
    metadata,

    // Actions
    streamChat,
    cancelStream,
    clearError,
    retry,
  };
}
