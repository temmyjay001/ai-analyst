import { QueryHistoryItem } from "@/types/query";

// lib/queryHistory.ts
class QueryHistoryManager {
  private static instance: QueryHistoryManager;
  private queries: QueryHistoryItem[] = [];

  static getInstance(): QueryHistoryManager {
    if (!QueryHistoryManager.instance) {
      QueryHistoryManager.instance = new QueryHistoryManager();
    }
    return QueryHistoryManager.instance;
  }

  addQuery(
    query: Omit<QueryHistoryItem, "id" | "timestamp" | "favorite">
  ): QueryHistoryItem {
    const newQuery: QueryHistoryItem = {
      ...query,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      favorite: false,
    };

    this.queries.unshift(newQuery); // Add to beginning

    // Keep only last 50 queries
    if (this.queries.length > 50) {
      this.queries = this.queries.slice(0, 50);
    }

    return newQuery;
  }

  getHistory(): QueryHistoryItem[] {
    return this.queries;
  }

  getFavorites(): QueryHistoryItem[] {
    return this.queries.filter((q) => q.favorite);
  }

  toggleFavorite(id: string): boolean {
    const query = this.queries.find((q) => q.id === id);
    if (query) {
      query.favorite = !query.favorite;
      return query.favorite;
    }
    return false;
  }

  getQuery(id: string): QueryHistoryItem | undefined {
    return this.queries.find((q) => q.id === id);
  }
}

export default QueryHistoryManager;
