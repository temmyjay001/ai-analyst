// app/api/ask/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { generateSQL, interpretResults } from "@/lib/ai";
import { getSchemaContext } from "@/lib/schema";
import { schemaCache, queryCache } from "@/lib/cache";
import crypto from "crypto";

// Helper to create cache key from question
function getQueryCacheKey(question: string): string {
  // Normalize question for better cache hits
  const normalized = question.toLowerCase().trim();
  return crypto.createHash("md5").update(normalized).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { question, useCache = true } = await request.json();

    if (!question) {
      return NextResponse.json(
        { success: false, error: "No question provided" },
        { status: 400 }
      );
    }

    console.log("Processing question:", question);

    // Check query cache if enabled
    const cacheKey = getQueryCacheKey(question);
    if (useCache) {
      const cached = queryCache.get(cacheKey);
      if (cached) {
        console.log("Returning cached query result");
        return NextResponse.json({
          ...cached,
          fromCache: true,
          cacheKey,
        });
      }
    }

    // Get schema (likely from cache)
    let schemaContext = schemaCache.get("db_schema");
    if (!schemaContext) {
      console.log("Schema not in cache, fetching...");
      schemaContext = await getSchemaContext();
      schemaCache.set("db_schema", schemaContext, 120);
    }

    // Generate SQL
    console.log("Generating SQL...");
    const sql = await generateSQL(question, schemaContext.formatted);
    console.log("Generated SQL:", sql);

    // Execute query
    console.log("Executing query...");
    const startTime = Date.now();
    const result = await query(sql);
    const queryTime = Date.now() - startTime;

    // Limit results for response
    const rowCount = result.rowCount;
    const limitedResults = result.rows.slice(0, 100);

    // Interpret results
    console.log("Interpreting results...");
    const interpretation = await interpretResults(
      question,
      sql,
      limitedResults,
      rowCount
    );

    const response = {
      success: true,
      question,
      sql,
      rowCount,
      queryTime,
      results: limitedResults,
      interpretation,
      truncated: rowCount > 100,
      timestamp: new Date().toISOString(),
      fromCache: false,
    };

    // Cache the successful result (30 minutes for queries)
    if (useCache) {
      queryCache.set(cacheKey, response, 30);
      console.log(`Cached query result with key: ${cacheKey}`);
    }

    return NextResponse.json({
      ...response,
      cacheKey,
    });
  } catch (error: any) {
    console.error("Ask endpoint error:", error);

    if (error.code) {
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
          sql: error.sql,
          code: error.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred",
      },
      { status: 500 }
    );
  }
}
