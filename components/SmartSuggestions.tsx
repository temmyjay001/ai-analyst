// components/SmartSuggestions.tsx
import React from "react";
import { Lightbulb, TrendingUp, Search, BarChart3 } from "lucide-react";

interface Suggestion {
  question: string;
  description: string;
  category: "drill-down" | "time-based" | "comparison" | "related";
}

interface SmartSuggestionsProps {
  suggestions: Suggestion[];
  onSelectSuggestion: (question: string) => void;
  loading?: boolean;
}

export default function SmartSuggestions({
  suggestions,
  onSelectSuggestion,
  loading = false,
}: SmartSuggestionsProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "drill-down":
        return <Search className="h-4 w-4" />;
      case "time-based":
        return <TrendingUp className="h-4 w-4" />;
      case "comparison":
        return <BarChart3 className="h-4 w-4" />;
      case "related":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "drill-down":
        return "text-blue-600 bg-blue-50";
      case "time-based":
        return "text-green-600 bg-green-50";
      case "comparison":
        return "text-purple-600 bg-purple-50";
      case "related":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium text-gray-900">
            Generating suggestions...
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 border border-gray-200 rounded-lg animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h3 className="font-medium text-gray-900">Explore further</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion.question)}
            className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 text-left transition-all group"
          >
            <div className="flex items-start space-x-2">
              <div
                className={`p-1 rounded ${getCategoryColor(
                  suggestion.category
                )}`}
              >
                {getCategoryIcon(suggestion.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">
                  {suggestion.question}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
