// lib/ai/gemini-streaming.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModelForPlan } from "../models";
import { getCachedSchemaName } from "./gemini-cache";
import { buildSQLGenerationPrompt } from "./sqlGenerator";
import { DatabaseType } from "../database/factory";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Stream SQL generation with context caching
 */
export async function* streamSQL(
  question: string,
  schemaContext: string,
  userPlan: string,
  dbType: DatabaseType,
  connectionId: string
): AsyncGenerator<string> {
  const modelName = getModelForPlan(userPlan);

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.1, // Low temp for SQL generation
    },
  });

  let cacheName: string | null = null;
  if (connectionId) {
    cacheName = await getCachedSchemaName(
      connectionId,
      schemaContext,
      modelName,
      dbType
    );
  }

  let prompt: string;

  if (cacheName) {
    // ✅ Schema is cached at Gemini API - just send the question!
    console.log(`💰 STREAMING with cached schema - 75% cost savings`);
    prompt = `User question: ${question}

      CRITICAL INSTRUCTIONS:
      1. If this is a valid question about the database, generate a ${dbType.toUpperCase()}-compatible SQL query.
      2. If this is gibberish, nonsense, or completely unrelated to data queries (e.g., random characters, emojis, testing input), respond with EXACTLY this format:

      UNABLE_TO_GENERATE_SQL: [Brief explanation of why, e.g., "This input doesn't appear to be a valid database question."]

      Examples of invalid inputs:
      - "asdfghjkl" → UNABLE_TO_GENERATE_SQL: This appears to be random characters.
      - "🎉🎉🎉" → UNABLE_TO_GENERATE_SQL: This input contains only emojis and no clear question.
      - "test test 123" → UNABLE_TO_GENERATE_SQL: This appears to be a test input without a clear data question.

      Generate the appropriate response now.`;
  } else {
    // ⚠️ No cache - build full prompt with schema
    console.log(`⚠️ STREAMING without cache - using full prompt`);
    const basePrompt = buildSQLGenerationPrompt(
      dbType,
      schemaContext,
      question,
      true
    );

    prompt = `${basePrompt}

      CRITICAL: If the user's question is gibberish, nonsense, random characters, or completely unrelated to data queries, respond with:
      UNABLE_TO_GENERATE_SQL: [Brief explanation]

      Otherwise, generate the SQL query as requested.`;
  }

  // Stream the response with optional cached content
  const result = await model.generateContentStream({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(cacheName && { cachedContent: cacheName }),
  });

  // Yield each chunk as it arrives
  for await (const chunk of result.stream) {
    const text = chunk.text();
    yield text;
  }
}

/**
 * Check if AI response indicates inability to generate SQL
 */
export function isUnableToGenerateSQL(sqlResponse: string): {
  isUnable: boolean;
  reason: string | null;
} {
  const trimmed = sqlResponse.trim();

  if (trimmed.startsWith("UNABLE_TO_GENERATE_SQL:")) {
    const reason = trimmed.replace("UNABLE_TO_GENERATE_SQL:", "").trim();
    return { isUnable: true, reason };
  }

  return { isUnable: false, reason: null };
}

/**
 * Stream interpretation with AI-generated suggestions for multi-turn chat
 */
export async function* streamInterpretationWithSuggestions(
  question: string,
  sql: string,
  results: any[],
  dbType: string,
  userPlan: string,
  includeFollowUpSuggestions: boolean = false
): AsyncGenerator<{ type: "interpretation" | "suggestions"; content: string }> {
  const model = genAI.getGenerativeModel({
    model: getModelForPlan(userPlan),
    generationConfig: {
      temperature: 0.7, // Higher temp for natural language
    },
  });

  const resultsSummary =
    results.length > 0
      ? JSON.stringify(results.slice(0, 10), null, 2)
      : "No results returned";

  const baseprompt = `You are a data analyst explaining query results to a business user.

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
- Don't just describe the data - provide insights`;

  const promptWithSuggestions = includeFollowUpSuggestions
    ? `${baseprompt}

After your interpretation, provide 3 intelligent follow-up question suggestions that the user might want to ask next. These should:
- Build upon the current results
- Explore different analytical angles (trends, comparisons, breakdowns, outliers)
- Be natural and conversational
- Be actionable and specific to this data

Format the suggestions section as:

---SUGGESTIONS_START---
1. [First natural language question]
2. [Second natural language question]
3. [Third natural language question]
---SUGGESTIONS_END---

Write your interpretation now, followed by the suggestions if applicable:`
    : `${baseprompt}

Write your interpretation now:`;

  const result = await model.generateContentStream(promptWithSuggestions);

  let fullResponse = "";
  let inSuggestionsSection = false;

  for await (const chunk of result.stream) {
    const text = chunk.text();
    fullResponse += text;

    // Check if we've entered suggestions section
    if (fullResponse.includes("---SUGGESTIONS_START---")) {
      // Split and emit interpretation first if not already done
      if (!inSuggestionsSection) {
        inSuggestionsSection = true;
        const parts = fullResponse.split("---SUGGESTIONS_START---");
        yield { type: "interpretation", content: parts[0] };
      }
    } else if (!inSuggestionsSection) {
      // Still in interpretation phase
      yield { type: "interpretation", content: text };
    }
  }

  // Extract and emit suggestions if present
  if (
    includeFollowUpSuggestions &&
    fullResponse.includes("---SUGGESTIONS_START---")
  ) {
    const suggestionsMatch = fullResponse.match(
      /---SUGGESTIONS_START---([\s\S]*?)---SUGGESTIONS_END---/
    );

    if (suggestionsMatch) {
      yield { type: "suggestions", content: suggestionsMatch[1].trim() };
    }
  }
}

/**
 * Legacy function for backward compatibility
 * Stream interpretation word by word (without suggestions)
 */
export async function* streamInterpretation(
  question: string,
  sql: string,
  results: any[],
  dbType: string,
  userPlan: string
): AsyncGenerator<string> {
  for await (const chunk of streamInterpretationWithSuggestions(
    question,
    sql,
    results,
    dbType,
    userPlan,
    false
  )) {
    if (chunk.type === "interpretation") {
      yield chunk.content;
    }
  }
}
