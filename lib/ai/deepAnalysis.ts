// lib/ai/deepAnalysis.ts
import { ConnectionConfig } from "@/lib/database/factory";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModelForPlan } from "../models";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface AnalysisStep {
  stepNumber: number;
  question: string;
  purpose: string;
  sql: string;
  results: any[];
  insights: string;
}

export interface DeepAnalysisResult {
  originalQuestion: string;
  originalSql: string;
  originalResults: any[];
  followUpSteps: AnalysisStep[];
  comprehensiveInsights: string;
  executionTimeMs: number;
}

/**
 * Generates 3 intelligent follow-up queries based on initial results
 */
export async function generateFollowUpQueries(
  originalQuestion: string,
  originalSql: string,
  originalResults: any[],
  schemaContext: string,
  dbType: string,
  userPlan: string = "growth"
): Promise<{
  queries: Array<{ question: string; purpose: string; sql: string }>;
}> {
  const model = genAI.getGenerativeModel({ model: getModelForPlan(userPlan) });

  // Prepare data summary for context
  const dataSummary =
    originalResults.length > 0
      ? JSON.stringify(originalResults.slice(0, 5), null, 2)
      : "No results returned";

  const prompt = `You are a data analyst who asks intelligent follow-up questions.

CONTEXT:
Original Question: "${originalQuestion}"
SQL Query: ${originalSql}
Results Summary (first 5 rows): ${dataSummary}
Total Rows: ${originalResults.length}

DATABASE SCHEMA:
${schemaContext}

DATABASE TYPE: ${dbType}

TASK:
Generate 3 intelligent follow-up questions that will provide deeper insights. Each follow-up should:
1. Build upon the original query results
2. Explore a different analytical angle (trends, comparisons, breakdowns, outliers)
3. Be answerable with the available schema
4. Provide actionable business insights

For each follow-up, provide:
- question: The follow-up question in natural language
- purpose: Why this question matters (1 sentence)
- sql: The ${dbType} query to answer it

IMPORTANT SQL SYNTAX:
${
  dbType === "postgresql"
    ? "Use PostgreSQL syntax (LIMIT, EXTRACT, ILIKE, etc.)"
    : dbType === "mysql"
    ? "Use MySQL syntax (LIMIT, DATE_FORMAT, LIKE, etc.)"
    : dbType === "mssql"
    ? "Use SQL Server syntax (TOP, DATEPART, LIKE, etc.)"
    : "Use SQLite syntax (LIMIT, strftime, LIKE, etc.)"
}

ONLY use SELECT queries. No INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, or TRUNCATE.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "queries": [
    {
      "question": "What is the trend over time?",
      "purpose": "Identify growth or decline patterns",
      "sql": "SELECT ..."
    },
    {
      "question": "How do different categories compare?",
      "purpose": "Find top and bottom performers",
      "sql": "SELECT ..."
    },
    {
      "question": "Are there any outliers or anomalies?",
      "purpose": "Identify unusual data points",
      "sql": "SELECT ..."
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text().trim();

  // Clean up markdown code blocks if present
  const cleanedResponse = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Failed to parse follow-up queries:", cleanedResponse);
    throw new Error("Failed to generate follow-up queries");
  }
}

/**
 * Analyzes the results of a follow-up query
 */
async function analyzeFollowUpResults(
  step: { question: string; purpose: string; sql: string },
  results: any[],
  stepNumber: number,
  userPlan: string = "growth"
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: getModelForPlan(userPlan) });

  const dataSummary =
    results.length > 0 ? JSON.stringify(results, null, 2) : "No results";

  const prompt = `Analyze this follow-up query result:

QUESTION: ${step.question}
PURPOSE: ${step.purpose}
SQL: ${step.sql}
RESULTS (${results.length} rows):
${dataSummary}

Provide a 2-3 sentence analysis that:
1. Directly answers the follow-up question with specific numbers
2. Highlights the most important finding
3. Explains what this means for the business

Be specific, actionable, and concise.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Generates comprehensive insights from all analysis steps
 */
async function generateComprehensiveInsights(
  originalQuestion: string,
  originalResults: any[],
  followUpSteps: AnalysisStep[],
  userPlan: string = "growth"
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: getModelForPlan(userPlan) });

  const stepsContext = followUpSteps
    .map(
      (step) => `
**${step.question}**
${step.insights}
`
    )
    .join("\n");

  const prompt = `You are a senior data analyst writing an executive summary.

ORIGINAL QUESTION: "${originalQuestion}"
Initial Results: ${originalResults.length} rows

FOLLOW-UP ANALYSIS COMPLETED:
${stepsContext}

Write a comprehensive 4-5 sentence summary that:

1. **Directly answers** the original question with specifics
2. **Synthesizes insights** from all follow-up analyses
3. **Highlights key patterns** or trends discovered
4. **Identifies concerns** or opportunities (if any)
5. **Recommends action** based on the data

Use markdown formatting with **bold** for emphasis. Be executive-ready and actionable.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Executes deep analysis with 3 follow-up queries
 */
export async function executeDeepAnalysis(
  originalQuestion: string,
  originalSql: string,
  originalResults: any[],
  connection: ConnectionConfig,
  schemaContext: string,
  dbType: string,
  userPlan: string = "growth"
): Promise<DeepAnalysisResult> {
  const startTime = Date.now();

  // Import executeQuery dynamically to avoid circular dependencies
  const { executeQuery } = await import("@/lib/database/factory");

  try {
    // Step 1: Generate follow-up queries
    const { queries } = await generateFollowUpQueries(
      originalQuestion,
      originalSql,
      originalResults,
      schemaContext,
      dbType,
      userPlan
    );

    // Step 2-4: Execute follow-up queries
    const followUpSteps: AnalysisStep[] = [];

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];

      try {
        // Execute the follow-up query
        const queryResult = await executeQuery(connection, query.sql);

        // Analyze the results
        const insights = await analyzeFollowUpResults(
          query,
          queryResult.rows,
          i + 1
        );

        followUpSteps.push({
          stepNumber: i + 1,
          question: query.question,
          purpose: query.purpose,
          sql: query.sql,
          results: queryResult.rows,
          insights,
        });
      } catch (error: any) {
        console.error(`Follow-up query ${i + 1} failed:`, error);
        // Continue with other queries even if one fails
        followUpSteps.push({
          stepNumber: i + 1,
          question: query.question,
          purpose: query.purpose,
          sql: query.sql,
          results: [],
          insights: `Unable to execute this analysis: ${error.message}`,
        });
      }
    }

    // Step 5: Generate comprehensive insights
    const comprehensiveInsights = await generateComprehensiveInsights(
      originalQuestion,
      originalResults,
      followUpSteps
    );

    const executionTimeMs = Date.now() - startTime;

    return {
      originalQuestion,
      originalSql,
      originalResults,
      followUpSteps,
      comprehensiveInsights,
      executionTimeMs,
    };
  } catch (error: any) {
    console.error("Deep analysis failed:", error);
    throw new Error(`Deep analysis failed: ${error.message}`);
  }
}

/**
 * Check if user has enough queries remaining for deep analysis
 */
export function canRunDeepAnalysis(
  currentQueryCount: number,
  dailyLimit: number
): { canRun: boolean; required: number; available: number } {
  const QUERIES_NEEDED = 3;
  const available = dailyLimit - currentQueryCount;

  return {
    canRun: available >= QUERIES_NEEDED,
    required: QUERIES_NEEDED,
    available,
  };
}
