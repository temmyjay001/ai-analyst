// components/ChatLayoutWrapper.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Menu } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ChatInterface from "@/components/ChatInterface";
import ChatSidebar from "@/components/ChatSidebar";
import { useSessionData } from "@/hooks/useSessionData";

interface ChatLayoutWrapperProps {
  sessionId?: string;
}

export default function ChatLayoutWrapper({
  sessionId,
}: Readonly<ChatLayoutWrapperProps>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initialize connectionId from localStorage immediately to prevent flicker
  const [connectionId, setConnectionId] = useState<string>(() => {
    if (typeof window === "undefined") return "";

    // Check URL first
    const urlConnection = searchParams.get("connection");
    if (urlConnection) return urlConnection;

    // Fall back to localStorage
    const lastConnection = localStorage.getItem("lastConnectionId");
    return lastConnection && lastConnection !== "undefined"
      ? lastConnection
      : "";
  });

  // Use SWR to get session data if we have a sessionId
  const { session, isLoading } = useSessionData(sessionId);

  // Update connectionId when we get session data or URL changes
  useEffect(() => {
    const urlConnection = searchParams.get("connection");

    if (urlConnection) {
      // URL parameter takes highest priority
      setConnectionId(urlConnection);
      localStorage.setItem("lastConnectionId", urlConnection);
    } else if (session?.connectionId) {
      // Use connection from session if available
      setConnectionId(session.connectionId);
      localStorage.setItem("lastConnectionId", session.connectionId);
    }
  }, [searchParams, session]);

  // Determine if we should show the "no connection" state
  // Only show it if:
  // 1. We don't have a connectionId AND
  // 2. We're not loading a session (which might provide one) AND
  // 3. We've checked localStorage
  const shouldShowNoConnection = useMemo(() => {
    // If we have a connectionId, we're good
    if (connectionId) return false;

    // If we're loading a session, wait for it
    if (sessionId && isLoading) return false;

    // If we have a sessionId but finished loading and still no connection, show error
    if (sessionId && !isLoading && !session?.connectionId) return true;

    // If no sessionId and no connectionId from localStorage, show error
    if (!sessionId && !connectionId) return true;

    return false;
  }, [connectionId, sessionId, isLoading, session]);

  if (shouldShowNoConnection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No database connection selected
          </p>
          <Button onClick={() => router.push("/connections")}>
            Select a Connection
          </Button>
        </div>
      </div>
    );
  }

  // Show a minimal loading state only if we truly don't have a connectionId yet
  if (!connectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:block w-64 border-r flex-shrink-0">
        <ChatSidebar connectionId={connectionId} currentSessionId={sessionId} />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <ChatSidebar
            connectionId={connectionId}
            currentSessionId={sessionId}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden border-b p-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface sessionId={sessionId} connectionId={connectionId} />
        </div>
      </div>
    </div>
  );
}
