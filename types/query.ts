// types/query.ts
export interface QueryHistoryItem {
  id: string;
  question: string;
  sql: string;
  results: any[];
  timestamp: Date;
  favorite: boolean;
  execution_time?: number;
  error?: string;
}
