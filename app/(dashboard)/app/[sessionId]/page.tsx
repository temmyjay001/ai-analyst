// app/(dashboard)/app/[sessionId]/page.tsx
"use client";

import { use } from "react";
import ChatLayoutWrapper from "@/components/ChatLayoutWrapper";

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = use(params);
  return <ChatLayoutWrapper sessionId={sessionId} />;
}
