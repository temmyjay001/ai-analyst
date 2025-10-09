// types/chat.ts

export type MessageRole = "user" | "assistant" | "system";

export interface ChatSession {
  id: string;
  userId: string;
  connectionId: string;
  title: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata?: MessageMetadata;
  createdAt: Date;
}

export interface MessageMetadata {
  sql?: string;
  results?: any[];
  executionTimeMs?: number;
  rowCount?: number;
  dbType?: string;
  error?: string;
  fromCache?: boolean;
  cacheKey?: string;
  isDeepAnalysis?: boolean;
  deepAnalysisSteps?: DeepAnalysisStep[];
  hasPartialError?: boolean;
  canRetry?: boolean;
  retryOf?: string;
  retryCount?: number;
  suggestions?: string[];
  isInformational?: boolean;
  originalInput?: string;
}

export interface DeepAnalysisStep {
  stepNumber: number;
  question: string;
  sql: string;
  results: any[];
  insights: string;
}

// SSE Event Types
export type SSEEventType =
  | "status"
  | "sql_generated"
  | "sql_executing"
  | "results"
  | "follow_ups_generated"
  | "step_start"
  | "step_complete"
  | "step_progress"
  | "comprehensive_insights_start"
  | "comprehensive_insights_chunk"
  | "comprehensive_insights_complete"
  | "interpretation_start"
  | "interpretation_chunk"
  | "interpretation_complete"
  | "deep_analysis_progress"
  | "complete"
  | "error";

export interface SSEEvent {
  type: SSEEventType;
  data: any;
}

export interface StreamStatus {
  stage:
    | "initializing"
    | "generating_sql"
    | "executing"
    | "interpreting"
    | "complete"
    | "error";
  message: string;
}

export interface StreamError {
  message: string;
  upgradeRequired?: boolean;
  requiredPlan?: "starter" | "growth" | "enterprise";
  limitReached?: boolean;
  currentUsage?: number;
  limit?: number;
  queriesNeeded?: number;
  queriesAvailable?: number;
  partial?: boolean;
  canRetry?: boolean;
  sql?: string;
}
