// components/NaturalLanguageFilterBar.tsx
import React, { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { NaturalLanguageFilter } from "@/lib/naturalLanguageFilter";

interface NaturalLanguageFilterBarProps {
  originalResults: any[];
  onFilter: (filtered: any[], message: string) => void;
  onClear: () => void;
}

export default function NaturalLanguageFilterBar({
  originalResults,
  onFilter,
  onClear,
}: NaturalLanguageFilterBarProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [filterMessage, setFilterMessage] = useState("");

  const applyFilter = () => {
    if (!filterQuery.trim()) {
      onClear();
      setIsActive(false);
      setFilterMessage("");
      return;
    }

    const { filtered, message } = NaturalLanguageFilter.applyFilter(
      originalResults,
      filterQuery
    );

    onFilter(filtered, message);
    setFilterMessage(message);
    setIsActive(true);
  };

  const clearFilter = () => {
    setFilterQuery("");
    setIsActive(false);
    setFilterMessage("");
    onClear();
  };

  // Example filters for user guidance
  const exampleFilters = [
    "amount > 1000",
    "status = failed",
    "just merchant Amazon",
    "top 10",
  ];

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center space-x-3">
        <Filter className="h-4 w-4 text-gray-500" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && applyFilter()}
          placeholder="Filter results naturally: 'amount > 100' or 'only failed transactions'"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={applyFilter}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          Apply Filter
        </button>
        {isActive && (
          <button
            onClick={clearFilter}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Filter message */}
      {filterMessage && (
        <div className="mt-2 text-sm text-gray-600">{filterMessage}</div>
      )}

      {/* Example filters (shown when input is empty) */}
      {!filterQuery && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="text-xs text-gray-500">Try:</span>
          {exampleFilters.map((example) => (
            <button
              key={example}
              onClick={() => setFilterQuery(example)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
