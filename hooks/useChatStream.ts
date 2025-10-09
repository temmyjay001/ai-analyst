// hooks/useChatStream.ts

import { useState, useCallback } from "react";
import { StreamError, StreamStatus } from "@/types/chat";

interface UseChatStreamOptions {
  onComplete?: (data: any) => void;
  onError?: (error: StreamError) => void;
  onUserMessageSaved?: (data: any) => void;
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

  const streamChat = useCallback(
    async (question: string, connectionId: string, sessionId: string) => {
      setStreaming(true);
      setStatus(null);
      setSqlChunks([]);
      setInterpretationChunks([]);
      setResults(null);
      setSuggestions([]);
      setError(null);
      setShowError(false);
      setIsInformational(false);

      try {
        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, connectionId, sessionId }),
        });

        if (!response.ok) {
          throw new Error("Failed to start stream");
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
        console.error("Stream error:", err);
        const streamError: StreamError =
          typeof err === "object" && err.message
            ? err
            : { message: String(err) };

        setError(streamError);
        setShowError(true);
        options.onError?.(streamError);
      } finally {
        setStreaming(false);
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

        case "user_message":
          // User message saved - notify parent to update the temp user message with real ID
          options.onUserMessageSaved?.(data);
          break;

        case "sql_chunk":
          setSqlChunks((prev) => [...prev, data.chunk]);
          break;

        case "sql_generated":
          // SQL generation complete
          break;

        case "results":
          setResults(data.results);
          break;

        case "interpretation_start":
          setInterpretationChunks([]);
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
          // Suggestions received separately
          setSuggestions(data.suggestions || []);
          break;

        case "informational_message":
          // AI couldn't generate SQL - show informational message
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
          break;

        case "complete":
          options.onComplete?.(data);
          break;

        case "error":
          setError(data as StreamError);
          setShowError(true);
          setStreaming(false);
          options.onError?.(data as StreamError);
          break;
      }
    },
    [options]
  );

  const clearError = useCallback(() => {
    setError(null);
    setShowError(false);
  }, []);

  return {
    streaming,
    status,
    sql: sqlChunks.join(""),
    interpretation: interpretationChunks.join(""),
    results,
    suggestions,
    error,
    showError,
    isInformational,
    streamChat,
    clearError,
  };
}
