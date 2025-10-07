// app/(dashboard)/app/[sessionId]/page.tsx
"use client";

import { use } from "react";
import ChatInterface from "@/components/ChatInterface";

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = use(params);
  return <ChatInterface sessionId={sessionId} />;
}
