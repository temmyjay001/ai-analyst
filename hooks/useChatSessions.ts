// hooks/useChatSessions.ts
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { fetcher } from "@/lib/swrConfig";

interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
  connectionId: string;
}

interface UseChatSessionsReturn {
  sessions: ChatSession[];
  isLoading: boolean;
  isError: any;
  mutate: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

/**
 * SWR hook for fetching chat sessions
 */
export function useChatSessions(
  connectionId: string | null
): UseChatSessionsReturn {
  const key = connectionId
    ? `/api/chat/sessions?connectionId=${connectionId}&limit=20`
    : null;

  const {
    data,
    error,
    mutate: mutateSessions,
  } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  /**
   * Delete a session with optimistic UI update
   */
  const deleteSession = async (sessionId: string) => {
    if (!connectionId) return;

    try {
      // Optimistic update - remove from UI immediately
      const currentSessions = data?.sessions || [];
      mutate(
        key,
        {
          sessions: currentSessions.filter(
            (s: ChatSession) => s.id !== sessionId
          ),
        },
        false
      );

      // Make API call
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      toast.success("Conversation deleted");

      // Revalidate to ensure consistency
      await mutateSessions();
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete conversation");

      // Revert on error
      await mutateSessions();
    }
  };

  /**
   * Manually refresh sessions
   */
  const refreshSessions = async () => {
    await mutateSessions();
  };

  return {
    sessions: data?.sessions || [],
    isLoading: !error && !data,
    isError: error,
    mutate: mutateSessions,
    deleteSession,
    refreshSessions,
  };
}

/**
 * Helper function to add a new session to the cache
 * Call this when a new session is created
 */
export function addSessionToCache(
  connectionId: string,
  newSession: Partial<ChatSession>
) {
  const key = `/api/chat/sessions?connectionId=${connectionId}&limit=20`;

  mutate(
    key,
    (current: any) => {
      if (!current?.sessions) return current;

      // Add new session to the beginning of the list
      return {
        ...current,
        sessions: [
          {
            id: newSession.id,
            title: newSession.title || "New Chat",
            messageCount: 0,
            updatedAt: new Date().toISOString(),
            connectionId,
          },
          ...current.sessions,
        ],
      };
    },
    false
  );
}
