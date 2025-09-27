// app/api/cache/route.ts
import { NextResponse } from "next/server";
import { schemaCache, queryCache } from "@/lib/cache";

export async function GET() {
  return NextResponse.json({
    schema: schemaCache.getStats(),
    queries: queryCache.getStats(),
    timestamp: new Date().toISOString(),
  });
}

export async function DELETE() {
  schemaCache.clear();
  queryCache.clear();

  return NextResponse.json({
    success: true,
    message: "All caches cleared",
  });
}
