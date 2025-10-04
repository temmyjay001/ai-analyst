// lib/ai/deepAnalysis-streaming.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModelForPlan } from "../models";
import { executeQuery, ConnectionConfig } from "@/lib/database/factory";
import { getSchemaContext } from "@/lib/database/schemaIntrospection";
import { db } from "@/lib/db";
import { databaseConnections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { validateAndCleanSQL } from "../utils/sql";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface DeepAnalysisEvent {
  type: string;
  data: any;
}

/**
 * Stream deep analysis with progress updates
 */
export async function* executeDeepAnalysisStreaming(
  originalQuestion: string,
  originalSql: string,
  originalResults: any[],
  connectionId: string,
  userPlan: string
): AsyncGenerator<DeepAnalysisEvent> {
  try {
    // Get connection config
    const connection = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.id, connectionId))
      .limit(1);

    if (!connection[0]) {
      throw new Error("Connection not found");
    }

    const dbConfig = connection[0] as ConnectionConfig;
    const dbType = dbConfig.type;

    // Get schema context
    const schemaContext = await getSchemaContext(dbConfig);

    yield {
      type: "status",
      data: { message: "Analyzing original results..." },
    };

    // Step 1: Generate 3 follow-up queries
    const followUpQueries = await generateFollowUpQueries(
      originalQuestion,
      originalSql,
      originalResults,
      schemaContext.formatted,
      dbType,
      userPlan
    );

    yield {
      type: "follow_ups_generated",
      data: { queries: followUpQueries },
    };

    // Step 2-4: Execute each follow-up query with streaming
    const analysisSteps = [];

    for (let i = 0; i < followUpQueries.queries.length; i++) {
      const query = followUpQueries.queries[i];
      const stepNumber = i + 1;

      yield {
        type: "step_start",
        data: {
          stepNumber,
          question: query.question,
          purpose: query.purpose,
        },
      };

      try {
        // Clean and validate SQL
        let cleanedSQL: string;
        try {
          cleanedSQL = validateAndCleanSQL(query.sql);
        } catch (validationError: any) {
          throw new Error(
            `Invalid SQL in follow-up ${stepNumber}: ${validationError.message}`
          );
        }

        // Execute the query
        yield {
          type: "step_progress",
          data: { message: `Executing query ${stepNumber}...` },
        };

        const queryResult = await executeQuery(dbConfig, cleanedSQL);

        yield {
          type: "step_progress",
          data: { message: `Analyzing results for step ${stepNumber}...` },
        };

        // Analyze results
        const insights = await analyzeFollowUpResults(
          { ...query, sql: cleanedSQL },
          queryResult.rows,
          stepNumber,
          userPlan
        );

        const step = {
          stepNumber,
          question: query.question,
          purpose: query.purpose,
          sql: cleanedSQL,
          results: queryResult.rows,
          insights,
        };

        analysisSteps.push(step);

        yield {
          type: "step_complete",
          data: step,
        };
      } catch (error: any) {
        console.error(`Follow-up query ${stepNumber} failed:`, error);

        const step = {
          stepNumber,
          question: query.question,
          purpose: query.purpose,
          sql: query.sql,
          results: [],
          insights: `Unable to complete this analysis: ${error.message}`,
        };

        analysisSteps.push(step);

        yield {
          type: "step_complete",
          data: step,
        };
      }
    }

    // Step 5: Generate comprehensive insights (streaming)
    yield {
      type: "comprehensive_insights_start",
      data: {},
    };

    let comprehensiveInsights = "";
    for await (const chunk of streamComprehensiveInsights(
      originalQuestion,
      originalResults,
      analysisSteps,
      userPlan
    )) {
      comprehensiveInsights += chunk;
      yield {
        type: "comprehensive_insights_chunk",
        data: { chunk },
      };
    }

    yield {
      type: "comprehensive_insights_complete",
      data: { insights: comprehensiveInsights },
    };
  } catch (error: any) {
    console.error("Deep analysis streaming failed:", error);
    throw error;
  }
}

/**
 * Generate follow-up queries
 */
async function generateFollowUpQueries(
  originalQuestion: string,
  originalSql: string,
  originalResults: any[],
  schemaContext: string,
  dbType: string,
  userPlan: string
): Promise<{
  queries: Array<{ question: string; purpose: string; sql: string }>;
}> {
  const model = genAI.getGenerativeModel({ model: getModelForPlan(userPlan) });

  const dataSummary =
    originalResults.length > 0
      ? JSON.stringify(originalResults, null, 2)
      : "No results returned";

  // EXACT PROMPT FROM deepAnalysis.ts
  const prompt = `You are a senior data analyst who asks intelligent follow-up questions to provide deeper business insights.

CONTEXT:
Original Question: "${originalQuestion}"
SQL Query Executed:
\`\`\`sql
${originalSql}
\`\`\`

Results Summary (first 5 of ${originalResults.length} rows):
\`\`\`json
${dataSummary}
\`\`\`

DATABASE SCHEMA:
${schemaContext}

DATABASE TYPE: ${dbType}

YOUR TASK:
Generate exactly 3 intelligent follow-up questions that will provide deeper insights beyond the original query. Each follow-up should:

1. **Build upon the original results** - don't repeat what we already know
2. **Explore different analytical angles**:
   - Trends over time (how has this changed?)
   - Comparisons across segments (how do different groups compare?)
   - Breakdowns and drill-downs (what's driving these numbers?)
   - Outliers and anomalies (are there unusual patterns?)
   - Context and benchmarks (how does this compare to norms?)

3. **Be answerable with the available schema** - only use tables/columns that exist
4. **Provide actionable business value** - answer "so what?" and "what should we do?"

For each follow-up, provide:
- **question**: A natural language question that adds new insights
- **purpose**: One sentence explaining why this matters for business decisions
- **sql**: A ${dbType} query that answers it efficiently

CRITICAL SQL REQUIREMENTS:
${
  dbType === "postgresql"
    ? "- Use PostgreSQL syntax: LIMIT, EXTRACT(), date_trunc(), ILIKE, etc.\n- Window functions and CTEs are encouraged for complex analysis"
    : dbType === "mysql"
    ? "- Use MySQL syntax: LIMIT, DATE_FORMAT(), LIKE, etc.\n- Subqueries preferred over CTEs"
    : dbType === "mssql"
    ? "- Use SQL Server syntax: TOP, DATEPART(), LIKE, etc.\n- Use appropriate date functions"
    : "- Use SQLite syntax: LIMIT, strftime(), LIKE, etc.\n- Keep queries simple"
}
- ONLY use SELECT queries (no INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE)
- Include appropriate aggregations (COUNT, SUM, AVG, MIN, MAX)
- Add ORDER BY and LIMIT for focused results
- Handle NULLs appropriately with COALESCE or filters

RESPONSE FORMAT:
Return ONLY valid JSON, no markdown code blocks, no explanations:

{
  "queries": [
    {
      "question": "How has this metric trended over the past 30 days?",
      "purpose": "Identify growth patterns or concerning declines",
      "sql": "SELECT date_column, COUNT(*) as count FROM table WHERE ... GROUP BY date_column ORDER BY date_column DESC LIMIT 30"
    },
    {
      "question": "Which segments or categories are driving these results?",
      "purpose": "Find top performers and underperformers for targeted action",
      "sql": "SELECT category, SUM(amount) as total FROM table WHERE ... GROUP BY category ORDER BY total DESC LIMIT 10"
    },
    {
      "question": "Are there any outliers or anomalies we should investigate?",
      "purpose": "Detect unusual patterns that might indicate problems or opportunities",
      "sql": "SELECT ... WHERE value > (SELECT AVG(value) + 2*STDDEV(value) FROM table)"
    }
  ]
}

Generate the follow-up queries now:`;

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
 * Analyze follow-up results
 * MIRRORED FROM deepAnalysis.ts
 */
async function analyzeFollowUpResults(
  step: { question: string; purpose: string; sql: string },
  results: any[],
  stepNumber: number,
  userPlan: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: getModelForPlan(userPlan) });

  const dataSummary =
    results.length > 0 ? JSON.stringify(results, null, 2) : "No results";

  // EXACT PROMPT FROM deepAnalysis.ts
  const prompt = `You are a data analyst providing quick, actionable insights.

FOLLOW-UP ANALYSIS #${stepNumber}:

Question: "${step.question}"
Purpose: ${step.purpose}

SQL Executed:
\`\`\`sql
${step.sql}
\`\`\`

Results (${results.length} rows):
\`\`\`json
${dataSummary}
\`\`\`

Provide a focused 2-3 sentence analysis that:
1. **Directly answers the question** with specific numbers from the results
2. **Highlights the most important finding** - what's the key takeaway?
3. **Explains the business implication** - what does this mean and what should we do?

Be specific, use actual numbers, and focus on actionable insights. Write your analysis:`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

/**
 * Stream comprehensive insights
 * MIRRORED FROM deepAnalysis.ts
 */
async function* streamComprehensiveInsights(
  originalQuestion: string,
  originalResults: any[],
  followUpSteps: any[],
  userPlan: string
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({
    model: getModelForPlan(userPlan),
    generationConfig: {
      temperature: 0.7,
    },
  });

  const stepsContext = followUpSteps
    .map(
      (step) => `
**Follow-up ${step.stepNumber}: ${step.question}**
${step.insights}
`
    )
    .join("\n");

  // EXACT PROMPT FROM deepAnalysis.ts
  const prompt = `You are a senior business analyst preparing an executive summary.

ORIGINAL QUESTION: "${originalQuestion}"
Initial Query Results: ${originalResults.length} rows

DEEP ANALYSIS COMPLETED - 3 Follow-up Investigations:
${stepsContext}

YOUR TASK:
Write a comprehensive executive summary (6-8 sentences) that synthesizes all findings into actionable business intelligence.

Your summary MUST:

1. **Lead with the direct answer** to the original question, using specific numbers
2. **Synthesize insights** from all three follow-ups into a coherent narrative
3. **Highlight the most critical finding** - what's the #1 thing leadership should know?
4. **Identify patterns or trends** discovered across the analysis
5. **Flag concerns or opportunities** - what requires immediate attention?
6. **Provide clear recommendations** - what specific actions should be taken?

FORMATTING:
- Use **bold** for key metrics, findings, and recommendations
- Write in clear, executive-appropriate language
- Organize with paragraph breaks for readability
- Lead with conclusions, not methodology

TONE:
- Confident and decisive
- Action-oriented
- Business-focused (not technical)
- Backed by data

Write your executive summary now:`;

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    yield text;
  }
}
