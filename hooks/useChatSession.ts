// hooks/useChatSession.ts
import { useState, useEffect, useCallback } from "react";
import { ChatMessage, ChatSession } from "@/types/chat";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

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
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Load session and messages
  useEffect(() => {
    if (initialSessionId) {
      loadSession(initialSessionId);
    }
  }, [initialSessionId]);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to load session");
      }

      const data = await response.json();
      setSession(data.session);
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(
    (sessionId: string, title: string) => {
      const newSession: ChatSession = {
        id: sessionId,
        userId: "", // Will be set by server
        connectionId,
        title,
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSession(newSession);

      // Update URL to include session ID
      if (pathname === "/app") {
        router.push(`/app/${sessionId}`, { scroll: false });
      }
    },
    [connectionId, pathname, router]
  );

  const addMessage = useCallback(
    (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);

      // Update session message count
      if (session) {
        setSession((prev) =>
          prev
            ? {
                ...prev,
                messageCount: prev.messageCount + 1,
                updatedAt: new Date(),
              }
            : null
        );
      }
    },
    [session]
  );

  const updateLastMessage = useCallback((updates: Partial<ChatMessage>) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;

      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      newMessages[lastIndex] = { ...newMessages[lastIndex], ...updates };

      return newMessages;
    });
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setMessages([]);

    // Navigate to base chat URL
    if (pathname !== "/app") {
      router.push("/app");
    }
  }, [pathname, router]);

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const response = await fetch(`/api/chat/sessions/${sessionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete session");
        }

        toast.success("Conversation deleted");
        clearSession();
      } catch (error) {
        console.error("Error deleting session:", error);
        toast.error("Failed to delete conversation");
      }
    },
    [clearSession]
  );

  const loadRecentSessions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/chat/sessions?connectionId=${connectionId}&limit=10`
      );
      if (!response.ok) {
        throw new Error("Failed to load sessions");
      }

      const data = await response.json();
      return data.sessions;
    } catch (error) {
      console.error("Error loading recent sessions:", error);
      return [];
    }
  }, [connectionId]);

  return {
    // State
    session,
    messages,
    loading,

    // Actions
    loadSession,
    createSession,
    addMessage,
    updateLastMessage,
    clearSession,
    deleteSession,
    loadRecentSessions,
  };
}
