// hooks/useSessionData.ts
import useSWR, { mutate } from "swr";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { fetcher } from "@/lib/swrConfig";
import { ChatMessage, ChatSession } from "@/types/chat";

interface UseSessionDataReturn {
  session: ChatSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isError: any;
  addMessage: (message: ChatMessage) => void;
  clearSession: () => void;
}

/**
 * SWR hook for fetching session data (session info + messages)
 */
export function useSessionData(sessionId?: string): UseSessionDataReturn {
  const router = useRouter();
  const pathname = usePathname();

  const key = sessionId ? `/api/chat/sessions/${sessionId}` : null;

  const { data, error } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 2000,
  });

  /**
   * Add a new message to the cache
   */
  const addMessage = (message: ChatMessage) => {
    if (!sessionId) return;

    mutate(
      key,
      (current: any) => {
        if (!current) return current;

        return {
          ...current,
          messages: [...(current.messages || []), message],
          session: {
            ...current.session,
            messageCount: (current.session?.messageCount || 0) + 1,
            updatedAt: new Date().toISOString(),
          },
        };
      },
      false // Don't revalidate immediately
    );
  };

  /**
   * Clear session and navigate
   */
  const clearSession = () => {
    if (pathname !== "/app") {
      router.push("/app");
    }
  };

  return {
    session: data?.session || null,
    messages: data?.messages || [],
    isLoading: !error && !data && !!sessionId,
    isError: error,
    addMessage,
    clearSession,
  };
}

/**
 * Helper to update a specific message in the cache
 */
export function updateMessageInCache(
  sessionId: string,
  messageId: string,
  updates: Partial<ChatMessage>
) {
  const key = `/api/chat/sessions/${sessionId}`;

  mutate(
    key,
    (current: any) => {
      if (!current?.messages) return current;

      return {
        ...current,
        messages: current.messages.map((msg: ChatMessage) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      };
    },
    false
  );
}
