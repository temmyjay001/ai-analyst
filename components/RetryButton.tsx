// components/RetryButton.tsx

"use client";

import { useState } from "react";
import { RotateCw, Loader2 } from "lucide-react";

interface RetryButtonProps {
  messageId: string;
  onSuccess: (newMessage: any) => void;
  onError: (error: string) => void;
}

export default function RetryButton({
  messageId,
  onSuccess,
  onError,
}: RetryButtonProps) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);

    try {
      const response = await fetch("/api/chat/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        onError(data.error || "Failed to retry query");
        return;
      }

      onSuccess(data.message);
    } catch (error: any) {
      onError(error.message || "Failed to retry query");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <button
      onClick={handleRetry}
      disabled={retrying}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {retrying ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCw className="h-4 w-4" />
      )}
      <span>{retrying ? "Retrying..." : "Retry Query"}</span>
    </button>
  );
}
