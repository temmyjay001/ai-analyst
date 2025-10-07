// lib/utils/sql.ts

/**
 * Clean SQL by removing markdown code blocks and extra whitespace
 */
export function cleanSQL(sql: string): string {
  if (!sql) return sql;

  let cleaned = sql;

  // Remove markdown code blocks (```sql ... ``` or ``` ... ```)
  cleaned = cleaned.replace(/```sql\s*/gi, "");
  cleaned = cleaned.replace(/```\s*/g, "");

  // Remove backticks at start/end
  cleaned = cleaned.replace(/^`+|`+$/g, "");

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Validate SQL - basic security check
 * Returns cleaned SQL if valid, throws error if dangerous
 */
export function validateAndCleanSQL(sql: string): string {
  const cleaned = cleanSQL(sql);

  if (!cleaned) {
    throw new Error("SQL query cannot be empty");
  }

  // Check for dangerous operations (case-insensitive)
  const dangerousPatterns = [
    /\bDROP\s+/i,
    /\bTRUNCATE\s+/i,
    /\bDELETE\s+FROM\s+/i,
    /\bUPDATE\s+/i,
    /\bINSERT\s+INTO\s+/i,
    /\bALTER\s+/i,
    /\bCREATE\s+/i,
    /\bGRANT\s+/i,
    /\bREVOKE\s+/i,
    /\bEXEC\s*\(/i,
    /\bEXECUTE\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleaned)) {
      throw new Error(
        `Dangerous SQL operation detected. Only SELECT queries are allowed.`
      );
    }
  }

  // Allow SELECT, WITH (CTEs), and EXPLAIN queries
  const upperSQL = cleaned.toUpperCase();
  const allowedStarts = [
    "SELECT",
    "WITH", // Common Table Expressions
    "EXPLAIN", // Query analysis
    "DESCRIBE", // Table description (MySQL)
    "SHOW", // Show commands (MySQL)
    "(", // Subquery starting with parenthesis
  ];

  const isAllowed = allowedStarts.some((start) => upperSQL.startsWith(start));

  if (!isAllowed) {
    throw new Error(
      `Only SELECT, WITH (CTE), and EXPLAIN queries are allowed. Received query starting with: ${cleaned.substring(
        0,
        50
      )}...`
    );
  }

  // Additional check: ensure no dangerous keywords after WITH or EXPLAIN
  // WITH should eventually lead to SELECT
  if (upperSQL.startsWith("WITH")) {
    // Check that there's a SELECT somewhere in the query
    if (!upperSQL.includes("SELECT")) {
      throw new Error("WITH clause must contain a SELECT statement");
    }
  }

  return cleaned;
}
