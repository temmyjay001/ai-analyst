// lib/ai.ts
// Updated to use Google Gemini instead of Groq
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

export async function generateSQL(
  question: string,
  schemaContext: string
): Promise<string> {
  const prompt = `You are a PostgreSQL expert. Generate a single SQL query based on this schema:

${schemaContext}

User question: ${question}

IMPORTANT:
- Return ONLY the SQL query, no explanations or markdown
- Use proper PostgreSQL syntax
- Add LIMIT clauses for queries that might return many rows
- Use appropriate JOINs based on the foreign key relationships shown in the schema`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 500,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    }
  );

  const data = await response.json();

  console.log("Gemini AI response:", JSON.stringify(data, null, 2));

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error("Gemini AI error:", data);
    throw new Error(
      "Failed to generate SQL: " + (data.error?.message || "Unknown error")
    );
  }

  // Clean up the response - Gemini sometimes includes markdown
  const sql = data.candidates[0].content.parts[0].text
    .trim()
    .replace(/```sql\n?/gi, "")
    .replace(/```\n?/gi, "")
    .replace(/^sql\n/gi, "") // Remove "sql" prefix if present
    .trim();

  return sql;
}

export async function interpretResults(
  question: string,
  sql: string,
  results: any[],
  rowCount: number
): Promise<string> {
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      }),
    }
  );

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error("Gemini interpretation error:", data);
    return "Results retrieved successfully. Please review the data table below.";
  }

  return data.candidates[0].content.parts[0].text.trim();
}

// Optional: Function to check if Gemini API is working
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello, respond with just 'OK' if you can read this.",
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
          },
        }),
      }
    );

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text?.includes("OK") || false
    );
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return false;
  }
}
