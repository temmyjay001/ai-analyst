// app/api/schema/route.ts
import { NextResponse } from "next/server";
import { getSchemaContext } from "@/lib/schema";
import { schemaCache } from "@/lib/cache";

const SCHEMA_CACHE_KEY = "db_schema";
const SCHEMA_CACHE_TTL = 120; // 2 hours for schema

export async function GET() {
  try {
    // Check cache first
    const cached = schemaCache.get(SCHEMA_CACHE_KEY);

    if (cached) {
      console.log("Returning cached schema");
      return NextResponse.json({
        success: true,
        schema: cached,
        fromCache: true,
      });
    }

    // Fetch fresh schema
    console.log("Fetching fresh schema...");
    const schema = await getSchemaContext();

    // Cache it
    schemaCache.set(SCHEMA_CACHE_KEY, schema, SCHEMA_CACHE_TTL);

    return NextResponse.json({
      success: true,
      schema,
      fromCache: false,
    });
  } catch (error: any) {
    console.error("Schema endpoint error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Add endpoint to clear cache (useful for testing)
export async function DELETE() {
  schemaCache.clear();
  return NextResponse.json({
    success: true,
    message: "Schema cache cleared",
  });
}
