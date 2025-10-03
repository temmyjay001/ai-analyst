// app/(dashboard)/app/[sessionId]/page.tsx
import UnifiedChatInterface from "@/components/UnifiedChatInterface";

interface SessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function SessionPage({ params }: SessionPageProps) {
  return <UnifiedChatInterface sessionId={params.sessionId} />;
}
