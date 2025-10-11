// hooks/useDeepAnalysisStream.ts
import { useState, useCallback, useRef } from "react";
import { DeepAnalysisStep, StreamError } from "@/types/chat";

interface UseDeepAnalysisStreamOptions {
  onComplete?: (data: any) => void;
  onError?: (error: StreamError) => void;
  onStepComplete?: (step: DeepAnalysisStep) => void;
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
  const [insightsChunks, setInsightsChunks] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamDeepAnalysis = useCallback(
    async (
      question: string,
      sql: string,
      results: any[],
      connectionId: string,
      sessionId: string
    ) => {
      // Reset state
      setStreaming(true);
      setCurrentStep(0);
      setSteps([]);
      setStatus("");
      setError(null);
      setShowError(false);
      setComprehensiveInsights("");
      setInsightsChunks([]);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat/deep-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            sql,
            results,
            connectionId,
            sessionId,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to start deep analysis");
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
        if (err.name === "AbortError") {
          console.log("Deep analysis aborted");
        } else {
          console.error("Deep analysis stream error:", err);
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

  const handleDeepAnalysisEvent = useCallback(
    (eventType: string, data: any) => {
      switch (eventType) {
        case "status":
          setStatus(data.message);
          break;

        case "step_start":
          setCurrentStep(data.stepNumber);
          setStatus(`Analyzing step ${data.stepNumber}: ${data.question}`);
          break;

        case "step_progress":
          setStatus(data.message);
          break;

        case "step_complete":
          const step: DeepAnalysisStep = {
            stepNumber: data.stepNumber,
            question: data.question,
            sql: data.sql,
            results: data.results,
            insights: data.insights,
          };
          setSteps((prev) => [...prev, step]);
          options.onStepComplete?.(step);
          break;

        case "comprehensive_insights_start":
          setStatus("Generating comprehensive insights...");
          setInsightsChunks([]);
          break;

        case "comprehensive_insights_chunk":
          setInsightsChunks((prev) => [...prev, data.chunk]);
          break;

        case "comprehensive_insights_complete":
          setComprehensiveInsights(data.insights);
          break;

        case "complete":
          setStatus("Deep analysis completed");
          options.onComplete?.(data);
          break;

        case "error":
          // Handle different types of errors
          if (data.upgradeRequired) {
            setError({
              ...data,
              message: "Deep Analysis requires Growth plan or higher",
            });
          } else if (data.limitReached) {
            setError({
              ...data,
              message: `Query limit reached. ${data.queriesAvailable} queries remaining today.`,
            });
          } else {
            setError(data as StreamError);
          }
          setShowError(true);
          setStreaming(false);
          options.onError?.(data as StreamError);
          break;
      }
    },
    [options]
  );

  const cancelDeepAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
      setStatus("Deep analysis cancelled");
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setShowError(false);
  }, []);

  return {
    // State
    streaming,
    currentStep,
    steps,
    status,
    error,
    showError,
    comprehensiveInsights: insightsChunks.join(""),

    // Actions
    streamDeepAnalysis,
    cancelDeepAnalysis,
    clearError,
  };
}
