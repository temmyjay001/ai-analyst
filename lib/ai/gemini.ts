// lib/ai/gemini.ts - Enhanced with Context Caching (FIXED)
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Model selection based on user plan
const MODEL_TIERS: Record<string, string> = {
  free: "gemini-2.0-flash",
  starter: "gemini-2.5-flash-lite",
  growth: "gemini-2.5-flash",
  enterprise: "gemini-2.5-pro",
};

// Models that support context caching
const CACHE_SUPPORTED_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
];

function getModelForPlan(plan: string): string {
  return MODEL_TIERS[plan] || MODEL_TIERS.free;
}

// In-memory cache for cache names (by connectionId)
// In production, consider using Redis or database
const schemaCacheNames = new Map<
  string,
  {
    cacheName: string;
    createdAt: number;
    expiresAt: number;
  }
>();

// Cache TTL: 1 hour (3600 seconds)
const CACHE_TTL_SECONDS = 3600;
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

/**
 * Get or create cached schema context for a connection
 * This reduces costs by 75% by caching the schema information
 */
async function getCachedSchemaName(
  connectionId: string,
  schemaInfo: string,
  modelName: string
): Promise<string | null> {
  // Check if model supports caching
  if (!CACHE_SUPPORTED_MODELS.includes(modelName)) {
    console.log(`⚠️ Model ${modelName} doesn't support caching`);
    return null;
  }

  // Check in-memory cache first
  const cached = schemaCacheNames.get(connectionId);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`✅ Using cached schema for connection: ${connectionId}`);
    return cached.cacheName;
  }

  // Create new cached content using the correct API
  try {
    console.log(`🔄 Creating new cached schema context for: ${connectionId}`);

    const systemInstruction = `You are a PostgreSQL expert that generates queries optimized for BOTH data accuracy AND visualization.

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

4. **ALWAYS ADD ORDER BY**:
   - Order by the numeric metric (DESC for top items, ASC for bottom)
   - This creates meaningful, ordered visualizations
   
5. **LIMIT RESULTS APPROPRIATELY**:
   - For bar/pie charts: LIMIT 20 (to avoid cluttered visualizations)
   - For time series: LIMIT 100
   - For simple counts: No limit needed

6. **THINK: "What would someone want to SEE in a chart?"**
   - Not just "what data answers the question"
   - Consider the visual representation of the answer

STANDARD SQL REQUIREMENTS:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax (CTEs, window functions allowed)
- Use appropriate JOINs based on foreign key relationships
- Only read-only operations (SELECT, WITH)
- Include proper WHERE clauses for filtering`;

    // Use the Gemini API caching endpoint
    const cacheResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: `models/${modelName}`,
          displayName: `Schema-${connectionId}`,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `DATABASE SCHEMA:\n\n${schemaInfo}\n\nRemember these instructions when generating queries based on this schema.`,
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
    });

    console.log(`✅ Cached schema created: ${cacheName}`);
    return cacheName;
  } catch (error: any) {
    console.error("❌ Error creating cached content:", error);
    // Continue without caching rather than failing
    return null;
  }
}

/**
 * Clean up expired caches (call periodically)
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

// Clean expired caches every 5 minutes
setInterval(cleanExpiredCaches, 5 * 60 * 1000);

export async function generateSQL(
  question: string,
  schemaInfo: string,
  userPlan: string = "free",
  connectionId?: string
): Promise<{ sql: string }> {
  try {
    const modelName = getModelForPlan(userPlan);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Try to use cached schema context if connectionId provided
    let cacheName: string | null = null;
    if (connectionId) {
      cacheName = await getCachedSchemaName(
        connectionId,
        schemaInfo,
        modelName
      );
    }

    let prompt: string;

    if (cacheName) {
      // Use cached model (75% cheaper!)
      console.log(`💰 Using cached model - saving 75% on schema tokens`);
      prompt = `User question: ${question}\n\nGenerate a visualization-ready SQL query for this question.`;
    } else {
      // Fallback to regular model
      console.log(`⚠️ Using regular model (no cache available)`);
      prompt = `You are a PostgreSQL expert that generates queries optimized for BOTH data accuracy AND visualization.

DATABASE SCHEMA:
${schemaInfo}

USER QUESTION: ${question}

CRITICAL VISUALIZATION REQUIREMENTS:
The query results will be displayed in interactive charts (bar charts, line charts, pie charts). 
Therefore, your query MUST be visualization-ready by following these rules:

1. **ALWAYS INCLUDE AGGREGATIONS for counting/filtering queries**:
   - When questions involve "users with X", "products that Y", include COUNT, SUM, or AVG
   
2. **SELECT ONLY CHART-RELEVANT COLUMNS**:
   - For aggregations: SELECT categorical_column, COUNT/SUM/AVG as metric_name
   - Maximum 2-3 columns: typically one categorical + one/two numeric metrics
   
3. **STRUCTURE FOR CHART TYPES**:
   - Bar/Pie charts need: category column (string) + numeric value column
   - Line charts need: date/time column + numeric value column
   - Always use meaningful column aliases

4. **ALWAYS ADD ORDER BY** for meaningful visualizations
   
5. **LIMIT RESULTS APPROPRIATELY** (20 for bar/pie, 100 for time series)

STANDARD SQL REQUIREMENTS:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax (CTEs, window functions allowed)
- Only read-only operations (SELECT, WITH)

Now generate a visualization-ready query.`;
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

// Smart data preparation for interpretation
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
    return {
      fullData: results,
      dataType: "medium",
      summary: generateSummaryStats(results) as any,
    };
  }

  return {
    dataType: "large",
    summary: {
      totalRows: rowCount,
      numericColumns: getNumericColumns(results[0]),
      statistics: generateSummaryStats(results),
      firstRows: results.slice(0, 10),
      lastRows: results.slice(-10),
      outliers: findOutliers(results) as any,
    },
  };
}

function getNumericColumns(row: any): string[] {
  return Object.keys(row).filter((key) => {
    const value = row[key];
    return (
      typeof value === "number" ||
      (typeof value === "string" && !isNaN(parseFloat(value)))
    );
  });
}

function generateSummaryStats(results: any[]) {
  if (results.length === 0) return {};

  const numericCols = getNumericColumns(results[0]);
  const stats: Record<string, any> = {};

  numericCols.forEach((col) => {
    const values = results
      .map((r) => parseFloat(r[col]))
      .filter((v) => !isNaN(v));

    if (values.length > 0) {
      const sorted = [...values].sort((a, b) => a - b);
      stats[col] = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        sum: values.reduce((a, b) => a + b, 0),
        count: values.length,
      };
    }
  });

  return stats;
}

function findOutliers(results: any[], topN: number = 5) {
  if (results.length === 0) return [];

  const numericCols = getNumericColumns(results[0]);
  if (numericCols.length === 0) return [];

  const primaryCol = numericCols[0];

  const sorted = [...results].sort((a, b) => {
    const aVal = parseFloat(a[primaryCol]);
    const bVal = parseFloat(b[primaryCol]);
    return bVal - aVal;
  });

  return {
    top: sorted.slice(0, topN),
    bottom: sorted.slice(-topN).reverse(),
  };
}

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

    let dataSection = "";
    let analysisInstructions = "";

    switch (dataContext.dataType) {
      case "small":
      case "aggregated":
        dataSection = `Complete Results (${rowCount} rows):
${JSON.stringify(dataContext.fullData, null, 2)}`;

        analysisInstructions = `Analyze the COMPLETE dataset above. Provide:
1. Key findings from the full data
2. Trends or patterns across all rows
3. Notable insights and business implications
4. Specific numbers and comparisons`;
        break;

      case "medium":
        dataSection = `Complete Results (${rowCount} rows):
${JSON.stringify(dataContext.fullData, null, 2)}

Summary Statistics:
${JSON.stringify(dataContext.summary?.statistics, null, 2)}`;

        analysisInstructions = `Analyze the complete dataset. Focus on:
1. Overall trends and patterns
2. Statistical insights (min, max, averages)
3. Distribution and outliers
4. Key business takeaways`;
        break;

      case "large":
        dataSection = `Dataset Overview:
- Total Rows: ${dataContext.summary!.totalRows}
- Numeric Columns: ${dataContext.summary!.numericColumns.join(", ")}

Summary Statistics:
${JSON.stringify(dataContext.summary!.statistics, null, 2)}

First 10 Rows:
${JSON.stringify(dataContext.summary!.firstRows, null, 2)}

Last 10 Rows:
${JSON.stringify(dataContext.summary!.lastRows, null, 2)}

${
  dataContext.summary!.outliers
    ? `Top/Bottom Values:
${JSON.stringify(dataContext.summary!.outliers, null, 2)}`
    : ""
}`;

        analysisInstructions = `You have summary statistics and strategic samples from a ${
          dataContext.summary!.totalRows
        }-row dataset.

Provide:
1. Analysis of the overall trends (using statistics)
2. Insights from temporal patterns (first vs last rows)
3. Notable outliers or extremes
4. Business implications and recommendations

Be specific with numbers from the statistics provided.`;
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
