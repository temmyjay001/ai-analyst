export interface QueryHistoryItem {
  id: string;
  sessionId: string;
  question: string;
  sql?: string;
  results?: any[];
  interpretation?: string;
  executionTimeMs?: number;
  rowCount?: number;
  isFavorite: boolean;
  createdAt: string;
  error?: string;
}
