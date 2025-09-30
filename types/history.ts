export interface QueryHistoryItem {
  id: string;
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
