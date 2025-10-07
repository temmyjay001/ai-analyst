// lib/cache/query-cache.ts

interface CachedResult {
  sql: string;
  results: any[];
  interpretation: string;
  executionTimeMs: number;
  rowCount: number;
  dbType: string;
  cachedAt: Date;
}

// In-memory cache (consider Redis for production)
const queryCache = new Map<string, CachedResult>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Generate cache key from question and connection
 */
export function generateCacheKey(
  question: string,
  connectionId: string
): string {
  // Normalize question (lowercase, trim, remove extra spaces)
  const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
  return `${connectionId}:${normalized}`;
}

/**
 * Get cached result if available and not expired
 */
export function getCachedResult(cacheKey: string): CachedResult | null {
  const cached = queryCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if expired
  const age = Date.now() - cached.cachedAt.getTime();
  if (age > CACHE_TTL) {
    queryCache.delete(cacheKey);
    return null;
  }

  return cached;
}

/**
 * Cache a query result
 */
export function setCachedResult(
  cacheKey: string,
  result: Omit<CachedResult, "cachedAt">
): void {
  queryCache.set(cacheKey, {
    ...result,
    cachedAt: new Date(),
  });
}

/**
 * Clear cache for a connection
 */
export function clearConnectionCache(connectionId: string): void {
  for (const [key] of queryCache) {
    if (key.startsWith(`${connectionId}:`)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  queryCache.clear();
}
