// lib/ai/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Model selection based on user plan
const MODEL_TIERS: Record<string, string> = {
  free: "gemini-1.5-flash",
  starter: "gemini-1.5-flash",
  growth: "gemini-2.0-flash-exp",
  enterprise: "gemini-1.5-pro",
};

function getModelForPlan(plan: string): string {
  return MODEL_TIERS[plan] || MODEL_TIERS.free;
}

export async function generateSQL(
  question: string,
  schemaInfo: string,
  userPlan: string = "free"
): Promise<{ sql: string }> {
  try {
    const modelName = getModelForPlan(userPlan);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = `You are a PostgreSQL expert. Generate a SQL query based on this schema:

${schemaInfo}

User question: ${question}

IMPORTANT:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax (CTEs, window functions, etc. are allowed)
- Add LIMIT clauses for queries that might return many rows
- Use appropriate JOINs based on the foreign key relationships
- CTEs (WITH statements) are valid and encouraged for complex queries
- Only use read-only operations (SELECT, WITH)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up the response - remove markdown formatting
    const sql = text
      .trim()
      .replace(/```sql\n?/gi, "")
      .replace(/```\n?/gi, "")
      .replace(/^sql\n/gi, "")
      .trim();

    // Validate it's a read-only query (SELECT or WITH)
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
    const hasDangerousOp = dangerousOps.some((op) => upperSQL.includes(op));

    if (hasDangerousOp) {
      throw new Error("Only read-only queries are allowed");
    }

    return { sql };
  } catch (error: any) {
    console.error("AI generation error:", error);
    throw new Error(`Failed to generate SQL: ${error.message}`);
  }
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

    const prompt = `Question: "${question}"

SQL Query executed:
${sql}

Query returned ${rowCount} rows.
Sample results (first 5 rows): ${JSON.stringify(results.slice(0, 5), null, 2)}

Write a clear, business-friendly summary of these results in 2-3 sentences. Focus on:
- Key insights and patterns
- Specific numbers and trends
- Business implications

Be concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Interpretation error:", error);
    return "Results retrieved successfully. Please review the data table below.";
  }
}
