// lib/ai/gemini-multidb.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DatabaseType } from "../database/factory";
import { buildSQLGenerationPrompt } from "./sqlGenerator";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Model selection based on user plan
function getModelForPlan(plan: string): string {
  switch (plan) {
    case "free":
      return "gemini-2.0-flash";
    case "starter":
      return "gemini-2.5-flash-lite";
    case "growth":
      return "gemini-2.5-flash";
    case "enterprise":
      return "gemini-2.5-pro";
    default:
      return "gemini-2.0-flash";
  }
}

// Cache management
const CACHE_TTL_SECONDS = 3600; // 1 hour
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

interface CacheEntry {
  cacheName: string;
  createdAt: number;
  expiresAt: number;
  dbType: DatabaseType;
}

const schemaCacheNames = new Map<string, CacheEntry>();

/**
 * Get or create cached schema context for a connection
 */
async function getCachedSchemaName(
  connectionId: string,
  schemaInfo: string,
  modelName: string,
  dbType: DatabaseType
): Promise<string | null> {
  try {
    const cached = schemaCacheNames.get(connectionId);

    if (cached && Date.now() < cached.expiresAt && cached.dbType === dbType) {
      console.log(`✅ Using existing cache: ${cached.cacheName}`);
      return cached.cacheName;
    }

    if (cached) {
      schemaCacheNames.delete(connectionId);
    }

    // Create system instruction based on database type
    const systemInstruction = `You are a ${dbType.toUpperCase()} expert that generates queries optimized for BOTH data accuracy AND visualization.

          When generating queries, you will receive:
          1. A database schema (which is cached for efficiency)
          2. A user question

          Your job is to generate read-only SQL queries that:
          - Use proper ${dbType.toUpperCase()} syntax
          - Are optimized for visualization (aggregations, proper column selection, ordering)
          - Follow all database-specific rules and limitations
          - Return only the SQL query with no explanations

          Remember the database schema provided below for future queries.`;

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

    schemaCacheNames.set(connectionId, {
      cacheName,
      createdAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS,
      dbType,
    });

    console.log(`✅ Created new cache: ${cacheName} for ${dbType}`);
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
  for (const [key, value] of schemaCacheNames.entries()) {
    if (value.expiresAt <= now) {
      schemaCacheNames.delete(key);
      console.log(`🗑️ Cleaned expired cache for: ${key}`);
    }
  }
}

setInterval(cleanExpiredCaches, 5 * 60 * 1000);

/**
 * Generate SQL query for any database type
 */
export async function generateSQL(
  question: string,
  schemaInfo: string,
  userPlan: string = "free",
  dbType: DatabaseType = "postgresql",
  connectionId?: string
): Promise<{ sql: string }> {
  try {
    const modelName = getModelForPlan(userPlan);
    const model = genAI.getGenerativeModel({ model: modelName });

    let cacheName: string | null = null;
    if (connectionId) {
      cacheName = await getCachedSchemaName(
        connectionId,
        schemaInfo,
        modelName,
        dbType
      );
    }

    let prompt: string;

    if (cacheName) {
      console.log(`💰 Using cached model - saving 75% on schema tokens`);
      prompt = `User question: ${question}\n\nGenerate a ${dbType.toUpperCase()}-compatible SQL query for this question.`;
    } else {
      console.log(`⚠️ Using regular model (no cache available)`);
      prompt = buildSQLGenerationPrompt(dbType, schemaInfo, question, true);
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      ...(cacheName && { cachedContent: cacheName }),
    });

    const response = result.response;
    const text = response.text();

    // Clean up the response
    const sql = text
      .trim()
      .replace(/```sql\n?/gi, "")
      .replace(/```\n?/gi, "")
      .replace(/^sql\n/gi, "")
      .trim();

    // Validate read-only query
    const upperSQL = sql.toUpperCase().trim();
    if (!upperSQL.startsWith("SELECT") && !upperSQL.startsWith("WITH")) {
      throw new Error("Only SELECT and WITH queries are allowed");
    }

    // Check for dangerous operations
    const dangerousOps = [
      "INSERT",
      "UPDATE",
      "DELETE",
      "DROP",
      "ALTER",
      "CREATE",
      "TRUNCATE",
      "EXEC",
      "EXECUTE",
    ];

    const hasDangerousOp = dangerousOps.some((op) => {
      const regex = new RegExp(`\\b${op}\\b`, "i");
      return regex.test(upperSQL);
    });

    if (hasDangerousOp) {
      throw new Error("Only read-only queries are allowed");
    }

    return { sql };
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error(`Failed to generate SQL: ${error.message}`);
  }
}

/**
 * Smart data preparation for interpretation
 */
interface DataContext {
  fullData?: any[];
  summary?: {
    totalRows: number;
    numericColumns: string[];
    statistics: Record<string, any>;
    firstRows: any[];
    lastRows: any[];
    outliers?: any[];
  };
  dataType: "small" | "medium" | "large" | "aggregated" | "raw";
}

function prepareDataContext(results: any[], rowCount: number): DataContext {
  const isAggregated =
    results.length > 0 &&
    Object.keys(results[0]).some(
      (key) =>
        key.toLowerCase().includes("count") ||
        key.toLowerCase().includes("sum") ||
        key.toLowerCase().includes("total") ||
        key.toLowerCase().includes("avg") ||
        key.toLowerCase().includes("min") ||
        key.toLowerCase().includes("max")
    );

  if (rowCount <= 20) {
    return {
      fullData: results,
      dataType: isAggregated ? "aggregated" : "small",
    };
  }

  if (rowCount <= 100) {
    const numericColumns =
      results.length > 0
        ? Object.keys(results[0]).filter(
            (key) => typeof results[0][key] === "number"
          )
        : [];

    const statistics: Record<string, any> = {};
    numericColumns.forEach((col) => {
      const values = results.map((r) => r[col]).filter((v) => v != null);
      if (values.length > 0) {
        statistics[col] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
        };
      }
    });

    return {
      fullData: results,
      summary: {
        totalRows: rowCount,
        numericColumns,
        statistics,
        firstRows: results.slice(0, 5),
        lastRows: results.slice(-5),
      },
      dataType: "medium",
    };
  }

  // Large dataset
  const numericColumns =
    results.length > 0
      ? Object.keys(results[0]).filter(
          (key) => typeof results[0][key] === "number"
        )
      : [];

  const statistics: Record<string, any> = {};
  numericColumns.forEach((col) => {
    const values = results.map((r) => r[col]).filter((v) => v != null);
    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      statistics[col] = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
      };
    }
  });

  return {
    summary: {
      totalRows: rowCount,
      numericColumns,
      statistics,
      firstRows: results.slice(0, 10),
      lastRows: results.slice(-10),
      outliers: results
        .sort((a, b) => {
          const aVal = numericColumns.length > 0 ? a[numericColumns[0]] : 0;
          const bVal = numericColumns.length > 0 ? b[numericColumns[0]] : 0;
          return bVal - aVal;
        })
        .slice(0, 5),
    },
    dataType: "large",
  };
}

/**
 * Interpret query results with smart context handling
 */
export async function interpretResults(
  question: string,
  sql: string,
  results: any[],
  rowCount: number,
  userPlan: string = "free"
): Promise<string> {
  try {
    const modelName = getModelForPlan(userPlan);
    const model = genAI.getGenerativeModel({ model: modelName });

    const dataContext = prepareDataContext(results, rowCount);

    let dataSection: string = "";
    let analysisInstructions: string = "";

    switch (dataContext.dataType) {
      case "aggregated":
        dataSection = `Aggregated Results (${rowCount} categories/groups):
${JSON.stringify(dataContext.fullData, null, 2)}`;

        analysisInstructions = `This is aggregated data (counts, sums, averages). Provide:
1. Clear interpretation of the aggregations
2. Key patterns or trends
3. Business insights and recommendations`;
        break;

      case "small":
        dataSection = `Complete Results (${rowCount} rows):
${JSON.stringify(dataContext.fullData, null, 2)}`;

        analysisInstructions = `Analyze the complete dataset. Focus on:
1. Key findings from the data
2. Notable patterns or outliers
3. Actionable insights`;
        break;

      case "medium":
        dataSection = `Results (${rowCount} rows):
First 5 rows:
${JSON.stringify(dataContext.summary!.firstRows, null, 2)}

Summary Statistics:
${JSON.stringify(dataContext.summary!.statistics, null, 2)}`;

        analysisInstructions = `Provide analysis of:
1. Overall trends and patterns
2. Statistical insights
3. Key business takeaways`;
        break;

      case "large":
        dataSection = `Large Dataset Overview:
- Total Rows: ${dataContext.summary!.totalRows}
- Numeric Columns: ${dataContext.summary!.numericColumns.join(", ")}

Summary Statistics:
${JSON.stringify(dataContext.summary!.statistics, null, 2)}

Sample (First 10):
${JSON.stringify(dataContext.summary!.firstRows, null, 2)}

Top Values:
${JSON.stringify(dataContext.summary!.outliers, null, 2)}`;

        analysisInstructions = `Analyze this large dataset summary:
1. Overall trends from statistics
2. Notable patterns or extremes
3. Business implications and recommendations`;
        break;
    }

    const prompt = `You are a data analyst providing insights from a database query.

CONTEXT:
Question: "${question}"

SQL Query:
${sql}

${dataSection}

TASK:
${analysisInstructions}

Write a clear, business-friendly analysis in 3-5 sentences. Be specific with numbers and actionable.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Interpretation error:", error);
    return "Results retrieved successfully. Please review the data table below.";
  }
}
