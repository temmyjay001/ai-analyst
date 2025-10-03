// lib/ai/gemini-streaming.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModelForPlan } from "../models";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Stream SQL generation word by word
 */
export async function* streamSQL(
  question: string,
  schemaContext: string,
  userPlan: string,
  dbType: string,
  connectionId: string
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({
    model: getModelForPlan(userPlan),
    generationConfig: {
      temperature: 0.1, // Low temp for SQL generation
    },
  });

  const systemInstruction = `You are a ${dbType} expert that generates queries optimized for BOTH data accuracy AND visualization.

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
${
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
   - LIMIT for row restrictions`
}

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

SCHEMA CONTEXT:
${schemaContext}

USER QUESTION:
${question}

Generate a ${dbType} query that answers the question and is ready for visualization.`;

  const prompt = systemInstruction;

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    yield text;
  }
}

/**
 * Stream interpretation word by word
 */
export async function* streamInterpretation(
  question: string,
  sql: string,
  results: any[],
  dbType: string,
  userPlan: string
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({
    model: getModelForPlan(userPlan),
    generationConfig: {
      temperature: 0.7, // Higher temp for natural language
    },
  });

  const resultsSummary =
    results.length > 0
      ? JSON.stringify(results, null, 2)
      : "No results returned";

  // EXACT PROMPT FROM gemini-multidb.ts
  const prompt = `You are a data analyst explaining query results to a business user.

DATABASE TYPE: ${dbType}
ORIGINAL QUESTION: "${question}"

SQL QUERY EXECUTED:
\`\`\`sql
${sql}
\`\`\`

QUERY RESULTS (${results.length} rows):
\`\`\`json
${resultsSummary}
\`\`\`

Your task is to provide a clear, insightful interpretation that:

1. **Directly answers the user's question** with specific numbers and facts
2. **Highlights key findings** - what stands out in the data?
3. **Provides context** - what do these numbers mean for the business?
4. **Notes any limitations** - missing data, edge cases, or caveats
5. **Uses formatting for readability**:
   - **Bold** for key metrics and important findings
   - Bullet points for lists
   - Clear paragraph breaks
   - Tables for comparisons (if appropriate)

CRITICAL GUIDELINES:
- Be conversational but professional
- Lead with the most important finding
- Use specific numbers, not vague statements
- If results are empty, explain why and suggest alternatives
- If there's an anomaly or surprising finding, call it out
- Keep it concise (2-4 paragraphs max unless complex)
- Don't just describe the data - provide insights

Write your interpretation now:`;

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    yield text;
  }
}
