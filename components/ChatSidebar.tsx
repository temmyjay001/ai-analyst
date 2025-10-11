// components/ChatSidebar.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Trash2,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ChatSession {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

interface ChatSidebarProps {
  connectionId: string;
  currentSessionId?: string;
}

export default function ChatSidebar({
  connectionId,
  currentSessionId,
}: Readonly<ChatSidebarProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  // Load sessions
  useEffect(() => {
    if (connectionId) {
      loadSessions();
    }
  }, [connectionId]);

  const loadSessions = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/chat/sessions?connectionId=${connectionId}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    router.push("/app");
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/app/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Conversation deleted");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));

        // If deleting current session, navigate to new chat
        if (sessionId === currentSessionId) {
          router.push("/app");
        }
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setDeleteSessionId(null);
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col bg-muted/30">
        {/* Header */}
        <div className="p-4 flex-shrink-0">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <Separator />

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
              Recent Conversations
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => {
                  const isActive = session.id === currentSessionId;

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
                        isActive && "bg-accent"
                      )}
                    >
                      <button
                        onClick={() => handleSelectSession(session.id)}
                        className="flex-1 flex items-start gap-2 text-left"
                      >
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {session.title || "Untitled"}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(session.updatedAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteSessionId(session.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="p-4 text-xs text-muted-foreground border-t flex-shrink-0">
          {sessions.length} conversation{sessions.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteSessionId}
        onOpenChange={() => setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteSessionId && handleDeleteSession(deleteSessionId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
