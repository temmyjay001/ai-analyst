import { useState, useCallback, useRef } from "react";
import { QueryHistoryItem } from "@/types/history";

export function useQueryHistory() {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchHistory = useCallback(async () => {
    if (hasLoadedRef.current) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/queries/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.queries || []);
        hasLoadedRef.current = true;
      }
    } catch (error) {
      console.error("Failed to fetch query history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/queries/history");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.queries || []);
      }
    } catch (error) {
      console.error("Failed to fetch query history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFavorite = useCallback(async (queryId: string) => {
    try {
      const response = await fetch(`/api/queries/${queryId}/favorite`, {
        method: "PATCH",
      });

      if (response.ok) {
        setHistory((prev) =>
          prev.map((q) =>
            q.id === queryId ? { ...q, isFavorite: !q.isFavorite } : q
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }, []);

  const deleteQuery = useCallback(async (queryId: string) => {
    if (!confirm("Delete this query from history?")) return;

    try {
      const response = await fetch(`/api/queries/${queryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setHistory((prev) => prev.filter((q) => q.id !== queryId));
      }
    } catch (error) {
      console.error("Failed to delete query:", error);
    }
  }, []);

  return {
    history,
    loading,
    fetchHistory,
    refetchHistory,
    toggleFavorite,
    deleteQuery,
  };
}
