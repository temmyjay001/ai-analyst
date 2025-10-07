export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sql?: string;
  results?: any[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  timestamp: Date;
  fromHistory?: boolean;
}
