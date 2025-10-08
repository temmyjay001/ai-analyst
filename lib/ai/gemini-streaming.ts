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

  // Try to get or create cached schema
  let cacheName: string | null = null;
  if (connectionId) {
    cacheName = await getCachedSchemaName(
      connectionId,
      schemaContext,
      modelName,
      dbType
    );
  }

  // Build prompt - simple if cached, full if not
  let prompt: string;

  if (cacheName) {
    // ✅ Schema is cached at Gemini API - just send the question!
    console.log(`💰 STREAMING with cached schema - 75% cost savings`);
    prompt = `User question: ${question}\n\nGenerate a ${dbType.toUpperCase()}-compatible SQL query for this question.`;
  } else {
    // ⚠️ No cache - build full prompt with schema
    console.log(`⚠️ STREAMING without cache - using full prompt`);
    prompt = buildSQLGenerationPrompt(dbType, schemaContext, question, true);
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

export async function* streamMongoQuery(
  question: string,
  schemaContext: string,
  userPlan: string
): AsyncGenerator<string> {
  const model = genAI.getGenerativeModel({
    model: getModelForPlan(userPlan),
  });

  const prompt = `You are an expert MongoDB query generator.

USER QUESTION: "${question}"

MONGODB SCHEMA (collections and inferred fields):
${schemaContext}

TASK: Generate a MongoDB query operation in JSON format to answer the question.

OUTPUT FORMAT (return ONLY valid JSON, no markdown):
{
  "collection": "collection_name",
  "operation": "find" | "aggregate" | "count",
  "query": { ... MongoDB query object ... },
  "options": { "limit": 100, "sort": {...} }
}

MONGODB QUERY EXAMPLES:

1. Find all documents:
{
  "collection": "users",
  "operation": "find",
  "query": {},
  "options": {}
}

2. Find with filter:
{
  "collection": "users",
  "operation": "find",
  "query": { "age": { "$gte": 18 } },
  "options": { "limit": 10 }
}

3. Aggregation pipeline:
{
  "collection": "orders",
  "operation": "aggregate",
  "query": [
    { "$group": { "_id": "$status", "count": { "$sum": 1 } } },
    { "$sort": { "count": -1 } }
  ]
}

4. Count documents:
{
  "collection": "products",
  "operation": "count",
  "query": { "price": { "$gt": 100 } }
}

RULES:
- Use MongoDB operators: $eq, $gt, $gte, $lt, $lte, $in, $regex, etc.
- For aggregations, use $group, $match, $sort, $project, $limit
- Always include reasonable limits (100-1000) for find operations
- Use _id for the primary key field
- Handle dates with ISODate format
- Return ONLY the JSON, no explanation

Generate the MongoDB query now:`;

  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    yield chunk.text();
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
