// types/chatSession.ts

export interface ChatSession {
  id: string;
  userId: string;
  connectionId: string;
  title: string;
  plan: "free" | "starter" | "growth" | "enterprise";
  isMultiTurn: boolean;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  connectionId: string;
  sessionId: string;
  role: "user" | "assistant";
  messageIndex: number;
  question?: string; // Only for user messages
  sqlGenerated?: string; // Only for assistant messages
  results?: any; // Only for assistant messages
  interpretation?: string; // Only for assistant messages
  executionTimeMs?: number;
  rowCount?: number;
  isFavorite: boolean;
  isShared: boolean;
  error?: string;
  fromCache: boolean;
  cacheKey?: string;
  createdAt: Date;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface CreateSessionPayload {
  connectionId: string;
  question: string;
  plan: string;
}

export interface AddMessageToSessionPayload {
  sessionId: string;
  question: string;
}
