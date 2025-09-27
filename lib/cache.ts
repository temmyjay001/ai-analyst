// lib/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttlMinutes: number = 60): void {
    const now = Date.now();
    this.store.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttlMinutes * 60 * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): { size: number; keys: string[] } {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }

    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Create singleton instances
export const schemaCache = new Cache();
export const queryCache = new Cache();
