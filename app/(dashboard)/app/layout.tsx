"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QueryHistorySidebar from "@/components/QueryHistorySidebar";
import { useQueryHistory } from "@/hooks/useQueryHistory";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [showSidebar, setShowSidebar] = useState(true);

  const {
    history,
    loading: loadingHistory,
    fetchHistory,
    refetchHistory,
    toggleFavorite,
    deleteQuery,
  } = useQueryHistory();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleHistoryItemClick = (sessionId: string) => {
    router.push(`/app/${sessionId}`);
  };

  const handleNewChat = () => {
    router.push("/app");
  };

  return (
    <div className="flex-1 flex bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <QueryHistorySidebar
        history={history}
        loading={loadingHistory}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleFavorite={toggleFavorite}
        onDeleteQuery={async (id) => {
          await deleteQuery(id);
          await refetchHistory();
        }}
        onHistoryItemClick={handleHistoryItemClick}
      />

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </div>
  );
}
