// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Star, History, X, Download, BarChart2 } from "lucide-react";
import QueryHistory from "../components/QueryHistory";
import SmartSuggestions from "../components/SmartSuggestions";
import ExportMenu from "../components/ExportMenu";
import NaturalLanguageFilterBar from "../components/NaturalLanguageFilterBar";
import DataVisualization from "../components/DataVisualization"; //VisualizationToggle,
import QueryHistoryManager from "../lib/queryHistory";
import { SmartSuggestionsEngine } from "../lib/smartSuggestions";
import { QueryHistoryItem } from "@/types/query";

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

  // History and suggestions state
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // New states for export, filter, and visualization features
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentQueryItem, setCurrentQueryItem] =
    useState<QueryHistoryItem | null>(null);
  const [filteredResults, setFilteredResults] = useState<any[] | null>(null);
  const [showChart, setShowChart] = useState(false);

  const historyManager = useRef(QueryHistoryManager.getInstance());
  const suggestionsEngine = useRef(SmartSuggestionsEngine.getInstance());

  // Fetch cache stats
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
    setHistory(historyManager.current.getHistory());
  }, []);

  const askQuestion = async (questionText?: string) => {
    const queryText = questionText || question;
    if (!queryText.trim()) return;

    setLoading(true);
    setResult(null);
    setSuggestions([]);
    setFilteredResults(null);
    setShowChart(false);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: queryText,
          useCache,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Create QueryHistoryItem for successful query
        const queryItem: QueryHistoryItem = {
          id: crypto.randomUUID(),
          question: queryText,
          sql: data.sql,
          results: data.results,
          interpretation: data.interpretation,
          execution_time: data.queryTime,
          timestamp: new Date(),
          favorite: false,
          fromCache: data.fromCache,
        };

        // Save to history
        const savedQuery = historyManager.current.addQuery(queryItem);
        setCurrentQueryItem(savedQuery);
        setHistory(historyManager.current.getHistory());

        // Generate suggestions
        setSuggestionsLoading(true);
        try {
          const newSuggestions =
            await suggestionsEngine.current.generateSuggestions(
              queryText,
              data.sql,
              data.results
            );
          setSuggestions(newSuggestions);
        } catch (error) {
          console.error("Failed to generate suggestions:", error);
        } finally {
          setSuggestionsLoading(false);
        }
      } else if (data.error) {
        // Still save failed queries to history
        const failedQuery: QueryHistoryItem = {
          id: crypto.randomUUID(),
          question: queryText,
          timestamp: new Date(),
          favorite: false,
          error: data.error,
        };
        historyManager.current.addQuery(failedQuery);
        setHistory(historyManager.current.getHistory());
      }

      setResult(data);
      fetchCacheStats();
    } catch (error) {
      console.error("Query failed:", error);
      setResult({
        success: false,
        error: "Failed to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuery = (query: QueryHistoryItem) => {
    setQuestion(query.question);
    if (query.results) {
      setResult({
        success: true,
        question: query.question,
        sql: query.sql,
        results: query.results,
        interpretation: query.interpretation,
        queryTime: query.execution_time,
        fromCache: query.fromCache,
      });
      setCurrentQueryItem(query);
      setFilteredResults(null);
      setShowChart(false);
    } else {
      askQuestion(query.question);
    }
  };

  const handleToggleFavorite = (id: string) => {
    historyManager.current.toggleFavorite(id);
    setHistory([...historyManager.current.getHistory()]);
  };

  const clearCache = async () => {
    try {
      await fetch("/api/cache", { method: "DELETE" });
      fetchCacheStats();
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  };

  const formatValue = (value: any) => {
    if (value === null) return "null";
    if (value === true) return "✓";
    if (value === false) return "✗";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Get the data to display (filtered or original)
  const displayData = filteredResults || result?.results || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🤖 Fintech AI Data Assistant
            </h1>
            <p className="text-gray-600">
              Ask questions about your data in plain English
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* History Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  setShowHistory(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  showFavorites
                    ? "bg-yellow-100 text-yellow-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Favorites"
              >
                <Star className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  setShowHistory(!showHistory);
                  setShowFavorites(false);
                }}
                className={`p-2 rounded-lg transition-colors ${
                  showHistory
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Query History"
              >
                <History className="h-5 w-5" />
              </button>
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
                    Schema:{" "}
                    {cacheStats.schema.size > 0 ? "✓ Cached" : "○ Empty"}
                  </div>
                  <div>Queries: {cacheStats.queries.size} cached</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 min-w-0">
          {/* Sidebar for History */}
          {(showHistory || showFavorites) && (
            <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">
                  {showFavorites ? "Favorites" : "Query History"}
                </h2>
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setShowFavorites(false);
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <QueryHistory
                history={history}
                onSelectQuery={handleSelectQuery}
                onToggleFavorite={handleToggleFavorite}
                showFavoritesOnly={showFavorites}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Input Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex gap-3 mb-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !loading && askQuestion()
                  }
                  placeholder="e.g., Show me failed transactions from yesterday, or What's the average transaction amount by merchant?"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  onClick={() => askQuestion()}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    "Ask Question"
                  )}
                </button>
              </div>

              {/* Cache Toggle */}
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
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <SmartSuggestions
                suggestions={suggestions}
                onSelectSuggestion={(suggestion) => {
                  setQuestion(suggestion);
                  askQuestion(suggestion);
                }}
                loading={suggestionsLoading}
              />
            )}

            {/* Results Section */}
            {result && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                {result.success ? (
                  <>
                    {/* Result Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Results
                      </h2>
                      <div className="flex items-center gap-3">
                        {/* Export Menu */}
                        {currentQueryItem && currentQueryItem.results && (
                          <div className="relative">
                            <button
                              onClick={() => setShowExportMenu(!showExportMenu)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              <span>Export & Share</span>
                            </button>
                            {showExportMenu && (
                              <ExportMenu
                                query={currentQueryItem}
                                onClose={() => setShowExportMenu(false)}
                              />
                            )}
                          </div>
                        )}

                        {/* Visualization Toggle */}
                        {result.results && result.results.length > 0 && (
                          <button
                            onClick={() => setShowChart(!showChart)}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                              showChart
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <BarChart2 className="h-4 w-4" />
                            <span>
                              {showChart ? "Hide Chart" : "Show Chart"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interpretation */}
                    {result.interpretation && (
                      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-900">{result.interpretation}</p>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex gap-4 text-sm text-gray-600 mb-4">
                      <span>
                        {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}{" "}
                        returned
                      </span>
                      {result.queryTime && (
                        <span>Query took {result.queryTime}ms</span>
                      )}
                      {result.fromCache && (
                        <span className="text-green-600">📦 From cache</span>
                      )}
                    </div>

                    {/* SQL Query */}
                    {result.sql && (
                      <details className="mb-4">
                        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                          View SQL Query
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                          {result.sql}
                        </pre>
                      </details>
                    )}

                    {/* Natural Language Filter */}
                    {result.results && result.results.length > 0 && (
                      <NaturalLanguageFilterBar
                        originalResults={result.results}
                        onFilter={(filtered, message) => {
                          setFilteredResults(filtered);
                        }}
                        onClear={() => setFilteredResults(null)}
                      />
                    )}

                    {/* Data Display - Chart or Table */}
                    {showChart &&
                    result.results &&
                    result.results.length > 0 ? (
                      <DataVisualization
                        data={displayData}
                        columns={Object.keys(result.results[0])}
                      />
                    ) : (
                      /* Data Table */
                      result.results &&
                      result.results.length > 0 && (
                        <div className="mt-4">
                          {/* Table Container with controlled width */}
                          <div className="w-full overflow-hidden border border-gray-200 rounded-lg">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {Object.keys(result.results[0]).map(
                                      (col) => (
                                        <th
                                          key={col}
                                          className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                          {/* Truncate long column names */}
                                          <div
                                            className="truncate max-w-[200px]"
                                            title={col}
                                          >
                                            {col}
                                          </div>
                                        </th>
                                      )
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {displayData.map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                      {Object.entries(row).map(
                                        ([key, val], j) => (
                                          <td
                                            key={j}
                                            className="px-3 py-2 text-sm text-gray-900"
                                          >
                                            {/* Smart value formatting with truncation */}
                                            <div
                                              className="max-w-[300px] truncate"
                                              title={String(formatValue(val))}
                                            >
                                              {formatValue(val)}
                                            </div>
                                          </td>
                                        )
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Optional: Show message if table is scrollable */}
                          {result.results &&
                            Object.keys(result.results[0]).length > 5 && (
                              <p className="text-xs text-gray-500 mt-2 text-center">
                                ← Scroll horizontally to see more columns →
                              </p>
                            )}
                        </div>
                      )
                    )}
                  </>
                ) : (
                  /* Error State */
                  <div className="text-red-600">
                    <h3 className="font-semibold mb-2">Error</h3>
                    <p>{result.error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
