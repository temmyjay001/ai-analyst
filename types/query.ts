export interface QueryHistoryItem {
  id: string;
  question: string;
  sql?: string;
  results?: any[];
  interpretation?: string;
  execution_time?: number;
  timestamp: Date;
  favorite: boolean;
  fromCache?: boolean;
  error?: string;
}
