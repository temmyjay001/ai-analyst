// hooks/useChatSession.ts
import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChatMessage, ChatSession } from "@/types/chat";
import { useSessionData } from "@/hooks/useSessionData";
import { addSessionToCache } from "@/hooks/useChatSessions";

interface UseChatSessionProps {
  initialSessionId?: string;
  connectionId: string;
}

export function useChatSession({
  initialSessionId,
  connectionId,
}: UseChatSessionProps) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    session,
    messages,
    isLoading: loading,
    addMessage: addMessageToCache,
    clearSession: clearSessionCache,
  } = useSessionData(initialSessionId);

  /**
   * Create a new session and add to cache
   */
  const createSession = useCallback(
    (sessionId: string, title: string) => {
      // Add to sessions list cache
      addSessionToCache(connectionId, {
        id: sessionId,
        title,
      });

      // Update URL to include session ID
      if (pathname === "/app") {
        router.push(`/app/${sessionId}`, { scroll: false });
      }
    },
    [connectionId, pathname, router]
  );

  /**
   * Add a message to the session
   */
  const addMessage = useCallback(
    (message: ChatMessage) => {
      addMessageToCache(message);
    },
    [addMessageToCache]
  );

  /**
   * Update the last message in the session
   */
  const updateLastMessage = useCallback(
    (updates: Partial<ChatMessage>) => {
      if (!initialSessionId || messages.length === 0) return;

      const lastMessage = messages[messages.length - 1];

      // Import and use the updateMessageInCache helper
      import("@/hooks/useSessionData").then(({ updateMessageInCache }) => {
        updateMessageInCache(initialSessionId, lastMessage.id, updates);
      });
    },
    [initialSessionId, messages]
  );

  /**
   * Clear session
   */
  const clearSession = useCallback(() => {
    clearSessionCache();
  }, [clearSessionCache]);

  return {
    // State
    session,
    messages,
    loading,

    // Actions
    createSession,
    addMessage,
    updateLastMessage,
    clearSession,
  };
}
