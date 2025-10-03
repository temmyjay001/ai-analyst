// app/(dashboard)/app/[sessionId]/page.tsx
import ChatContent from "@/components/ChatContent";

interface SessionPageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { sessionId } = await params;
  return <ChatContent sessionId={sessionId} />;
}
