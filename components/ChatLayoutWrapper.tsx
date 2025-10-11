// components/ChatLayoutWrapper.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ChatInterface from "@/components/ChatInterface";
import ChatSidebar from "@/components/ChatSidebar";

interface ChatLayoutWrapperProps {
  sessionId?: string;
}

export default function ChatLayoutWrapper({
  sessionId,
}: Readonly<ChatLayoutWrapperProps>) {
  const searchParams = useSearchParams();
  const [connectionId, setConnectionId] = useState<string>("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Get connection from URL or session
  useEffect(() => {
    // First check URL params
    const urlConnection = searchParams.get("connection");
    if (urlConnection) {
      setConnectionId(urlConnection);
      // Store in localStorage for persistence
      localStorage.setItem("lastConnectionId", urlConnection);
    } else if (sessionId) {
      // Load connection from session
      fetch(`/api/chat/sessions/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.session?.connectionId) {
            setConnectionId(data.session.connectionId);
            localStorage.setItem("lastConnectionId", data.session.connectionId);
          }
        })
        .catch((err) =>
          console.error("Failed to load session connection:", err)
        );
    } else {
      // Fall back to last used connection
      const lastConnection = localStorage.getItem("lastConnectionId");
      if (lastConnection && lastConnection !== "undefined") {
        setConnectionId(lastConnection);
      }
    }
  }, [searchParams, sessionId]);

  if (!connectionId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            No database connection selected
          </p>
          <Button onClick={() => (window.location.href = "/connections")}>
            Select a Connection
          </Button>
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
