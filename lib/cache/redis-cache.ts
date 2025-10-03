// lib/cache/redis-cache.ts

import Redis from "ioredis";

// Create Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});

// Connect with error handling
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});

interface CachedResult {
  sql: string;
  results: any[];
  interpretation: string;
  executionTimeMs: number;
  rowCount: number;
  dbType: string;
  cachedAt: string;
}

const CACHE_TTL = 60 * 60; // 1 hour in seconds

/**
 * Generate cache key from question and connection
 */
export function generateCacheKey(
  question: string,
  connectionId: string
): string {
  // Normalize question (lowercase, trim, remove extra spaces)
  const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
  return `query:${connectionId}:${normalized}`;
}

/**
 * Get cached result from Redis
 */
export async function getCachedResult(
  cacheKey: string
): Promise<CachedResult | null> {
  try {
    const cached = await redis.get(cacheKey);

    if (!cached) {
      return null;
    }

    return JSON.parse(cached) as CachedResult;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

/**
 * Cache a query result in Redis
 */
export async function setCachedResult(
  cacheKey: string,
  result: Omit<CachedResult, "cachedAt">
): Promise<void> {
  try {
    const cacheData: CachedResult = {
      ...result,
      cachedAt: new Date().toISOString(),
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Redis set error:", error);
    // Don't throw - caching failure shouldn't break the request
  }
}

/**
 * Clear cache for a specific connection
 */
export async function clearConnectionCache(
  connectionId: string
): Promise<void> {
  try {
    const pattern = `query:${connectionId}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `Cleared ${keys.length} cached queries for connection ${connectionId}`
      );
    }
  } catch (error) {
    console.error("Redis clear connection cache error:", error);
  }
}

/**
 * Clear all query cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    const pattern = "query:*";
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} cached queries`);
    }
  } catch (error) {
    console.error("Redis clear all cache error:", error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  memoryUsed: string;
  hitRate?: number;
}> {
  try {
    const pattern = "query:*";
    const keys = await redis.keys(pattern);
    const info = await redis.info("memory");

    // Parse memory info
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    const memoryUsed = memoryMatch ? memoryMatch[1].trim() : "Unknown";

    return {
      totalKeys: keys.length,
      memoryUsed,
    };
  } catch (error) {
    console.error("Redis stats error:", error);
    return {
      totalKeys: 0,
      memoryUsed: "Unknown",
    };
  }
}

/**
 * Disconnect Redis (for cleanup)
 */
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}

export { redis };
