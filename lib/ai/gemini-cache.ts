// lib/ai/gemini-cache.ts
import { DatabaseType } from "../database/factory";

const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

interface CacheEntry {
  cacheName: string;
  createdAt: number;
  expiresAt: number;
  dbType: DatabaseType;
}

const schemaCacheNames = new Map<string, CacheEntry>();

// Models that support context caching
const CACHE_SUPPORTED_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
];

/**
 * Build system instruction for SQL generation based on database type
 */
export function buildSystemInstruction(dbType: DatabaseType): string {
  const dbSpecificSyntax =
    dbType === "postgresql"
      ? `   - Use PostgreSQL features: date_trunc(), EXTRACT(), string_agg(), etc.
   - Window functions: ROW_NUMBER() OVER (PARTITION BY ...)
   - JSON functions: jsonb_agg(), json_build_object()`
      : dbType === "mysql"
      ? `   - Use MySQL features: DATE_FORMAT(), GROUP_CONCAT(), etc.
   - Avoid PostgreSQL-specific functions
   - Be careful with date arithmetic`
      : dbType === "mssql"
      ? `   - Use SQL Server features: FORMAT(), STRING_AGG(), etc.
   - Use TOP instead of LIMIT
   - Use DATEPART() for date operations`
      : `   - Use SQLite features: strftime(), group_concat(), etc.
   - Simpler date functions
   - LIMIT for row restrictions`;

  return `You are a ${dbType.toUpperCase()} expert that generates queries optimized for BOTH data accuracy AND visualization.

CRITICAL VISUALIZATION REQUIREMENTS:
The query results will be displayed in interactive charts (bar charts, line charts, pie charts). 
Therefore, your query MUST be visualization-ready by following these rules:

1. **ALWAYS INCLUDE AGGREGATIONS for counting/filtering queries**:
   - When questions involve "users with X", "products that Y", include COUNT, SUM, or AVG
   - Example: "Users with more than 5 transactions" should return user names + transaction counts, NOT just user records
   
2. **SELECT ONLY CHART-RELEVANT COLUMNS**:
   - For aggregations: SELECT categorical_column, COUNT/SUM/AVG as metric_name
   - Avoid SELECT * or unnecessary columns that won't visualize well
   - Maximum 2-3 columns: typically one categorical + one/two numeric metrics
   
3. **STRUCTURE FOR CHART TYPES**:
   - Bar/Pie charts need: category column (string) + numeric value column
   - Line charts need: date/time column + numeric value column
   - Always use meaningful column aliases (e.g., "transaction_count" not "count")

4. **APPLY APPROPRIATE LIMITS**:
   - Bar/Pie charts: LIMIT to top 10-15 categories
   - Line charts: Sample data appropriately (daily/weekly/monthly depending on range)
   - Always include ORDER BY for consistent, meaningful results

5. **DATABASE-SPECIFIC SYNTAX**:
${dbSpecificSyntax}

6. **OPTIMIZATION**:
   - Use indexes when possible (primary keys, foreign keys)
   - Avoid subqueries when JOINs work better
   - Filter early (WHERE before JOIN when possible)

CRITICAL RULES:
- Generate ONLY the SQL query, no explanations, no markdown
- Use ONLY SELECT statements (no INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE)
- Handle NULL values appropriately (COALESCE, IS NULL checks)
- Use proper date handling for time-series queries
- Always include ORDER BY for predictable results
- Test edge cases (empty results, NULL values, divisions by zero)

When generating queries, you will receive:
1. A database schema (which is cached for efficiency)
2. A user question

Your job is to generate read-only SQL queries that: 
- Use proper ${dbType.toUpperCase()} syntax
- Are optimized for visualization (aggregations, proper column selection, ordering)
- Follow all database-specific rules and limitations
- Return only the SQL query with no explanations
`;
}

/**
 * Get or create cached schema context for a connection
 * Returns cacheName if successful, null if caching not supported/failed
 */
export async function getCachedSchemaName(
  connectionId: string,
  schemaInfo: string,
  modelName: string,
  dbType: DatabaseType
): Promise<string | null> {
  try {
    // Check if model supports caching
    if (!CACHE_SUPPORTED_MODELS.includes(modelName)) {
      console.log(`⚠️ Model ${modelName} doesn't support caching`);
      return null;
    }

    // Check in-memory cache first
    const cached = schemaCacheNames.get(connectionId);
    if (cached && Date.now() < cached.expiresAt && cached.dbType === dbType) {
      console.log(`✅ Using existing cache: ${cached.cacheName}`);
      return cached.cacheName;
    }

    // Clear old cache if exists
    if (cached) {
      schemaCacheNames.delete(connectionId);
    }

    // Create new cached content
    console.log(
      `🔄 Creating new cached schema for: ${connectionId} (${dbType})`
    );

    const systemInstruction = buildSystemInstruction(dbType);

    const cacheResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: `models/${modelName}`,
          displayName: `${dbType}-${connectionId}`,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `DATABASE SCHEMA:\n\n${schemaInfo}\n\nRemember this ${dbType.toUpperCase()} schema for generating queries.`,
                },
              ],
            },
          ],
          ttl: `${CACHE_TTL_SECONDS}s`,
        }),
      }
    );

    if (!cacheResponse.ok) {
      const errorText = await cacheResponse.text();
      console.error("❌ Failed to create cache:", errorText);
      return null;
    }

    const cacheData = await cacheResponse.json();
    const cacheName = cacheData.name;

    // Store in memory cache
    schemaCacheNames.set(connectionId, {
      cacheName,
      createdAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
      dbType,
    });

    console.log(`✅ Created cache: ${cacheName} for ${dbType}`);
    return cacheName;
  } catch (error: any) {
    console.error("❌ Error creating cached content:", error);
    return null;
  }
}

/**
 * Clean up expired caches
 */
export function cleanExpiredCaches() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, value] of schemaCacheNames.entries()) {
    if (value.expiresAt <= now) {
      schemaCacheNames.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🗑️ Cleaned ${cleaned} expired cache(s)`);
  }
}

/**
 * Manually invalidate cache for a connection
 * Call this when schema changes (e.g., after migrations)
 */
export function invalidateCache(connectionId: string) {
  const deleted = schemaCacheNames.delete(connectionId);
  if (deleted) {
    console.log(`🗑️ Invalidated cache for: ${connectionId}`);
  }
  return deleted;
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    totalCaches: schemaCacheNames.size,
    caches: Array.from(schemaCacheNames.entries()).map(([id, cache]) => ({
      connectionId: id,
      dbType: cache.dbType,
      age: Date.now() - cache.createdAt,
      expiresIn: cache.expiresAt - Date.now(),
    })),
  };
}

// Clean expired caches every 5 minutes
setInterval(cleanExpiredCaches, 5 * 60 * 1000);
