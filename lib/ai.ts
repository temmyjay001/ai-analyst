// lib/ai.ts
// Using Groq (free and fast!)
const GROQ_API_KEY = process.env.GROQ_API_KEY!;

export async function generateSQL(
  question: string,
  schemaContext: string
): Promise<string> {
  const prompt = `You are a PostgreSQL expert. Generate a single SQL query based on this schema:

${schemaContext}

User question: ${question}

Return ONLY the SQL query, no explanations or markdown.`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // Or 'llama2-70b-4096' - both free!
        messages: [
          {
            role: "system",
            content:
              "You are a PostgreSQL expert. Generate only SQL queries, no explanations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    }
  );

  const data = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    console.error("Groq AI error:", data);
    throw new Error("Failed to generate SQL");
  }

  // Clean up the response
  const sql = data.choices[0].message.content
    .trim()
    .replace(/```sql\n?/gi, "")
    .replace(/```\n?/gi, "")
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
Query returned ${rowCount} rows.
First 5 rows: ${JSON.stringify(results.slice(0, 5), null, 2)}

Write a 2-3 sentence business-friendly summary of these results. Be specific about the numbers.`;

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a data analyst who explains query results clearly and concisely.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    }
  );

  const data = await response.json();

  console.log("AI response:", data);

  if (!data.choices?.[0]?.message?.content) {
    return "Results retrieved successfully. Please review the data table below.";
  }

  return data.choices[0].message.content.trim();
}
