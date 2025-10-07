// lib/schemaCache.ts - Schema-specific caching with 2-hour TTL
interface SchemaCacheEntry {
  schema: {
    tables: any[];
    formatted: string;
  };
  timestamp: number;
  expiresAt: number;
}

class SchemaCache {
  private cache: Map<string, SchemaCacheEntry> = new Map();
  private readonly TTL_MINUTES = 120; // 2 hours for schema

  /**
   * Get cached schema for a connection
   * @param connectionId Unique identifier for the database connection
   * @returns Cached schema or null if expired/missing
   */
  get(connectionId: string) {
    const entry = this.cache.get(connectionId);

    if (!entry) {
      console.log(`[SchemaCache] MISS for connection: ${connectionId}`);
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      console.log(`[SchemaCache] EXPIRED for connection: ${connectionId}`);
      this.cache.delete(connectionId);
      return null;
    }

    console.log(`[SchemaCache] HIT for connection: ${connectionId}`);
    return entry.schema;
  }

  /**
   * Cache schema for a connection
   * @param connectionId Unique identifier for the database connection
   * @param schema The schema data to cache
   */
  set(connectionId: string, schema: any): void {
    const now = Date.now();
    this.cache.set(connectionId, {
      schema,
      timestamp: now,
      expiresAt: now + this.TTL_MINUTES * 60 * 1000,
    });
    console.log(
      `[SchemaCache] CACHED for connection: ${connectionId} (expires in ${this.TTL_MINUTES} minutes)`
    );
  }

  /**
   * Invalidate cache for a specific connection
   * Call this when connection details change
   */
  invalidate(connectionId: string): void {
    const deleted = this.cache.delete(connectionId);
    if (deleted) {
      console.log(`[SchemaCache] INVALIDATED for connection: ${connectionId}`);
    }
  }

  /**
   * Clear all cached schemas
   * Useful for testing or maintenance
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[SchemaCache] CLEARED ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    return {
      totalEntries: entries.length,
      validEntries: entries.filter(([_, e]) => now <= e.expiresAt).length,
      expiredEntries: entries.filter(([_, e]) => now > e.expiresAt).length,
      oldestEntry: entries.length
        ? new Date(Math.min(...entries.map(([_, e]) => e.timestamp)))
        : null,
      newestEntry: entries.length
        ? new Date(Math.max(...entries.map(([_, e]) => e.timestamp)))
        : null,
    };
  }

  /**
   * Clean up expired entries
   * Call periodically to prevent memory leaks
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SchemaCache] Cleaned up ${cleaned} expired entries`);
    }

    return cleaned;
  }
}

// Singleton instance
export const schemaCache = new SchemaCache();

// Auto-cleanup every 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    schemaCache.cleanup();
  }, 30 * 60 * 1000);
}
