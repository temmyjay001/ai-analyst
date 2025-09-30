// lib/ai/gemini.ts - Enhanced interpretation with smart context

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Model selection based on user plan
const MODEL_TIERS: Record<string, string> = {
  free: "gemini-2.0-flash",
  starter: "gemini-2.5-flash-lite",
  growth: "gemini-2.5-flash",
  enterprise: "gemini-2.5-pro",
};

// Token limits per model (conservative estimates for safety)
const MODEL_TOKEN_LIMITS: Record<string, number> = {
  "gemini-2.0-flash": 800000, // 1M context, keep buffer
  "gemini-2.5-flash-lite": 800000,
  "gemini-2.5-flash": 800000,
  "gemini-2.5-pro": 1500000, // 2M context, keep buffer
};

function getModelForPlan(plan: string): string {
  return MODEL_TIERS[plan] || MODEL_TIERS.free;
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
  // Detect if this is aggregated data (has COUNT, SUM, AVG, etc.)
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

  // Small datasets: send everything
  if (rowCount <= 20) {
    return {
      fullData: results,
      dataType: isAggregated ? "aggregated" : "small",
    };
  }

  // Medium datasets (21-100 rows): send full data + summary
  if (rowCount <= 100) {
    return {
      fullData: results,
      dataType: "medium",
      summary: generateSummaryStats(results) as any,
    };
  }

  // Large datasets (>100 rows): send summary with strategic samples
  return {
    dataType: "large",
    summary: {
      totalRows: rowCount,
      numericColumns: getNumericColumns(results[0]),
      statistics: generateSummaryStats(results),
      firstRows: results.slice(0, 10), // First 10
      lastRows: results.slice(-10), // Last 10
      outliers: findOutliers(results) as any, // Top/bottom extremes
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

  // Use the first numeric column for outlier detection
  const primaryCol = numericCols[0];

  const sorted = [...results].sort((a, b) => {
    const aVal = parseFloat(a[primaryCol]);
    const bVal = parseFloat(b[primaryCol]);
    return bVal - aVal; // Descending
  });

  return {
    top: sorted.slice(0, topN),
    bottom: sorted.slice(-topN).reverse(),
  };
}

// Estimate token count (rough approximation: 1 token ≈ 4 chars)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
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
    const tokenLimit = MODEL_TOKEN_LIMITS[modelName];

    // Prepare smart context
    const dataContext = prepareDataContext(results, rowCount);

    let dataSection = "";
    let analysisInstructions = "";

    switch (dataContext.dataType) {
      case "small":
      case "aggregated":
        // Send all data for small/aggregated datasets
        dataSection = `Complete Results (${rowCount} rows):
${JSON.stringify(dataContext.fullData, null, 2)}`;

        analysisInstructions = `Analyze the COMPLETE dataset above. Provide:
1. Key findings from the full data
2. Trends or patterns across all rows
3. Notable insights and business implications
4. Specific numbers and comparisons`;
        break;

      case "medium":
        // Send full data with summary stats
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
        // Send strategic samples + comprehensive summary
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

    // Check token limit (leave room for prompt + response)
    const estimatedTokens = estimateTokens(dataSection);
    if (estimatedTokens > tokenLimit * 0.8) {
      // Fallback to summary-only if too large
      dataSection = `Dataset Summary:
- Total Rows: ${rowCount}
- Sample Results: ${JSON.stringify(results.slice(0, 10), null, 2)}
- Statistics: ${JSON.stringify(generateSummaryStats(results), null, 2)}`;
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
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Interpretation error:", error);
    return "Results retrieved successfully. Please review the data table below.";
  }
}

// Keep existing generateSQL function unchanged
export async function generateSQL(
  question: string,
  schemaInfo: string,
  userPlan: string = "free"
): Promise<{ sql: string }> {
  try {
    const modelName = getModelForPlan(userPlan);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are a PostgreSQL expert that generates queries optimized for BOTH data accuracy AND visualization.

DATABASE SCHEMA:
${schemaInfo}

USER QUESTION: ${question}

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

EXAMPLES OF GOOD VISUALIZATION-READY QUERIES:

❌ BAD (returns raw records, not chart-friendly):
SELECT u.* FROM users u JOIN transactions t ON u.id = t.user_id GROUP BY u.id HAVING COUNT(t.id) > 5

✅ GOOD (category + metric, perfect for bar chart):
SELECT u.name, COUNT(t.id) as transaction_count 
FROM users u 
JOIN transactions t ON u.id = t.user_id 
GROUP BY u.id, u.name 
HAVING COUNT(t.id) > 5 
ORDER BY transaction_count DESC 
LIMIT 20

❌ BAD (no aggregation):
SELECT * FROM products WHERE category = 'Electronics'

✅ GOOD (aggregated with category):
SELECT category, COUNT(*) as product_count, AVG(price) as avg_price
FROM products
GROUP BY category
ORDER BY product_count DESC

❌ BAD (SELECT * with timestamp):
SELECT * FROM sales WHERE created_at > NOW() - INTERVAL '30 days'

✅ GOOD (time series ready):
SELECT DATE(created_at) as sale_date, SUM(amount) as daily_revenue
FROM sales
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY sale_date ASC

STANDARD SQL REQUIREMENTS:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax (CTEs, window functions allowed)
- Use appropriate JOINs based on foreign key relationships
- Only read-only operations (SELECT, WITH)
- Include proper WHERE clauses for filtering

Now generate a visualization-ready query for the user's question.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const sql = text
      .trim()
      .replace(/```sql\n?/gi, "")
      .replace(/```\n?/gi, "")
      .replace(/^sql\n/gi, "")
      .trim();

    const upperSQL = sql.toUpperCase().trim();
    if (!upperSQL.startsWith("SELECT") && !upperSQL.startsWith("WITH")) {
      throw new Error("Only SELECT and WITH queries are allowed");
    }

    const dangerousOps = [
      "INSERT",
      "UPDATE",
      "DELETE",
      "DROP",
      "ALTER",
      "CREATE",
      "TRUNCATE",
    ];
    const hasDangerousOp = dangerousOps.some((op) => upperSQL.includes(op));

    console.log("Generated SQL:", { sql });

    //  if (hasDangerousOp) {
    //    throw new Error("Only read-only queries are allowed");
    // }

    return { sql };
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error(`Failed to generate SQL: ${error.message}`);
  }
}
