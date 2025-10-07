// hooks/useDeepAnalysisStream.ts

import { useState, useCallback } from "react";
import { DeepAnalysisStep, StreamError } from "@/types/chat";

interface UseDeepAnalysisStreamOptions {
  onComplete?: (data: any) => void;
  onError?: (error: StreamError) => void;
}

export function useDeepAnalysisStream(
  options: UseDeepAnalysisStreamOptions = {}
) {
  const [streaming, setStreaming] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState<DeepAnalysisStep[]>([]);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<StreamError | null>(null);
  const [showError, setShowError] = useState(false);
  const [comprehensiveInsights, setComprehensiveInsights] =
    useState<string>("");

  const streamDeepAnalysis = useCallback(
    async (
      question: string,
      sql: string,
      results: any[],
      connectionId: string,
      sessionId: string
    ) => {
      setStreaming(true);
      setCurrentStep(0);
      setSteps([]);
      setStatus("");
      setError(null);
      setShowError(false);
      setComprehensiveInsights("");

      try {
        const response = await fetch("/api/chat/deep-analysis/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            sql,
            results,
            connectionId,
            sessionId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to start deep analysis");
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

              handleDeepAnalysisEvent(eventType, data);
            }
          }
        }
      } catch (err: any) {
        console.error("Deep analysis stream error:", err);
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

  const handleDeepAnalysisEvent = useCallback(
    (eventType: string, data: any) => {
      switch (eventType) {
        case "status":
          setStatus(data.message);
          break;

        case "follow_ups_generated":
          setStatus("Follow-up queries generated");
          break;

        case "step_start":
          setCurrentStep(data.stepNumber);
          setStatus(`Analyzing step ${data.stepNumber} of 3...`);
          break;

        case "step_progress":
          setStatus(data.message);
          break;

        case "step_complete":
          setSteps((prev) => [...prev, data]);
          break;

        case "comprehensive_insights_start":
          setStatus("Generating comprehensive insights...");
          break;

        case "comprehensive_insights_chunk":
          setComprehensiveInsights((prev) => prev + data.chunk);
          break;

        case "comprehensive_insights_complete":
          setComprehensiveInsights(data.insights);
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
    currentStep,
    steps,
    status,
    error,
    showError,
    comprehensiveInsights,
    streamDeepAnalysis,
    clearError,
  };
}
