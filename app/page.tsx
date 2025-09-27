// app/page.tsx
"use client";

import { useState, useEffect } from "react";

interface QueryResult {
  success: boolean;
  question?: string;
  sql?: string;
  rowCount?: number;
  queryTime?: number;
  results?: any[];
  interpretation?: string;
  truncated?: boolean;
  error?: string;
  fromCache?: boolean;
  cacheKey?: string;
  timestamp?: string;
}

interface CacheStats {
  schema: { size: number; keys: string[] };
  queries: { size: number; keys: string[] };
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [useCache, setUseCache] = useState(true);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  // Fetch cache stats on mount and after queries
  const fetchCacheStats = async () => {
    try {
      const response = await fetch("/api/cache");
      const data = await response.json();
      setCacheStats(data);
    } catch (error) {
      console.error("Failed to fetch cache stats:", error);
    }
  };

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const askQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, useCache }),
      });

      const data = await response.json();
      setResult(data);

      // Update cache stats after query
      fetchCacheStats();
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    try {
      await fetch("/api/cache", { method: "DELETE" });
      fetchCacheStats();
      alert("Cache cleared successfully");
    } catch (error) {
      alert("Failed to clear cache");
    }
  };

  const formatValue = (value: any) => {
    if (value === null) return "null";
    if (value === true) return "✓";
    if (value === false) return "✗";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header with cache stats */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 Fintech AI Data Assistant
            </h1>
            <p className="text-gray-600">
              Ask questions about your data in plain English
            </p>
          </div>

          {/* Cache Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4 text-sm">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="font-semibold text-gray-700">Cache Status</h3>
              <button
                onClick={clearCache}
                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Clear All
              </button>
            </div>
            {cacheStats && (
              <div className="space-y-1 text-gray-600">
                <div>
                  Schema: {cacheStats.schema.size > 0 ? "✓ Cached" : "○ Empty"}
                </div>
                <div>Queries: {cacheStats.queries.size} cached</div>
              </div>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !loading && askQuestion()}
              placeholder="e.g., Show me failed transactions from yesterday, or What's the average transaction amount by merchant?"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={askQuestion}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>

          {/* Cache toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCache"
              checked={useCache}
              onChange={(e) => setUseCache(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="useCache" className="text-sm text-gray-600">
              Use cache for faster responses
            </label>
          </div>

          {/* Sample questions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Try:</span>
            {[
              "How many transactions failed today?",
              "Top 10 merchants by volume",
              "Average transaction amount this week",
              "Users with more than 5 transactions",
            ].map((sample) => (
              <button
                key={sample}
                onClick={() => setQuestion(sample)}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {result.success ? (
              <>
                {/* Interpretation with cache indicator */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Answer
                    </h2>
                    {result.fromCache && (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        ⚡ From Cache
                      </span>
                    )}
                  </div>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {result.interpretation}
                  </div>
                  {result.timestamp && (
                    <div className="mt-3 text-xs text-gray-500">
                      Generated: {new Date(result.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>

                {/* SQL Query */}
                <div className="bg-gray-900 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-semibold text-gray-100">
                      Generated SQL
                    </h2>
                    <span className="text-sm text-gray-400">
                      {result.queryTime}ms • {result.rowCount} rows
                    </span>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code>{result.sql}</code>
                  </pre>
                </div>

                {/* Data Table */}
                {result.results && result.results.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Results {result.truncated && "(first 100 rows)"}
                      </h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(result.results[0]).map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.results.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {Object.values(row).map((value, vidx) => (
                                <td
                                  key={vidx}
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                >
                                  {formatValue(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-semibold mb-2">Error</h3>
                <p className="text-red-600">{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
