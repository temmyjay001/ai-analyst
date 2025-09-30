// components/DataVisualization.tsx
"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// FIXED: Much stricter date detection
const detectVisualizationType = (data: any[]) => {
  if (!data || data.length === 0) {
    return null;
  }

  const columns = Object.keys(data[0]);
  if (columns.length === 0) {
    return null;
  }

  // FIXED: Stricter date detection - check column name first, then validate value
  const dateColumns = columns.filter((col) => {
    const colLower = col.toLowerCase();

    // Must have date-related keyword in column name
    const hasDateKeyword =
      colLower.includes("date") ||
      colLower.includes("month") ||
      colLower.includes("year") ||
      colLower.includes("day") ||
      colLower.includes("created_at") ||
      colLower.includes("updated_at") ||
      colLower.includes("timestamp");

    if (!hasDateKeyword) {
      return false; // Column name must suggest it's a date
    }

    // Validate the value is actually a date string (not just parseable as date)
    const sampleValue = data[0][col];
    if (!sampleValue || typeof sampleValue !== "string") {
      return false;
    }

    // Check if it's an ISO date string or standard date format
    // ISO: 2024-08-31T23:00:00.000Z or 2024-08-31
    // Standard: 08/31/2024, 31-08-2024, etc.
    const isISODate = /^\d{4}-\d{2}-\d{2}/.test(sampleValue);
    const hasTimeComponent =
      sampleValue.includes("T") || sampleValue.includes(":");
    const looksLikeDate = isISODate || hasTimeComponent;

    return looksLikeDate;
  });

  // Numeric detection - exclude date columns
  const numericColumns = columns.filter((col) => {
    const sample = data[0][col];
    if (sample === null || sample === undefined) return false;

    // Check if it's a number or a parseable numeric string
    const isNumeric =
      typeof sample === "number" ||
      (typeof sample === "string" &&
        !isNaN(parseFloat(sample)) &&
        parseFloat(sample).toString() !== "NaN");

    // Exclude date columns from numeric columns
    const isDateCol = dateColumns.includes(col);

    return isNumeric && !isDateCol;
  });

  // Categorical detection - exclude dates and numbers
  const categoricalColumns = columns.filter((col) => {
    const sample = data[0][col];
    const isString = typeof sample === "string";
    const isNotNumeric = isNaN(parseFloat(sample));
    const isNotDate = !dateColumns.includes(col);

    return isString && isNotNumeric && isNotDate;
  });

  // Time series detection - PRIORITIZE THIS
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    // Pick the best numeric column (prefer count/amount columns, avoid IDs)
    const preferredNumeric =
      numericColumns.find((col) => {
        const lower = col.toLowerCase();
        return (
          lower.includes("count") ||
          lower.includes("amount") ||
          lower.includes("total") ||
          lower.includes("sum") ||
          lower.includes("avg")
        );
      }) || numericColumns[0];

    return {
      type: "line",
      x: dateColumns[0],
      y: preferredNumeric,
      title: `${preferredNumeric.replace(/_/g, " ")} over Time`,
    };
  }

  // Category comparison (bar chart)
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length > 0 &&
    data.length <= 20
  ) {
    return {
      type: "bar",
      x: categoricalColumns[0],
      y: numericColumns[0],
      title: `${numericColumns[0].replace(
        /_/g,
        " "
      )} by ${categoricalColumns[0].replace(/_/g, " ")}`,
    };
  }

  // Distribution (pie chart) - for small datasets
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length > 0 &&
    data.length <= 10
  ) {
    return {
      type: "pie",
      label: categoricalColumns[0],
      value: numericColumns[0],
      title: `Distribution of ${numericColumns[0].replace(/_/g, " ")}`,
    };
  }

  // FALLBACK: If we have any numeric column, try a simple bar chart
  if (numericColumns.length > 0 && data.length <= 20) {
    const xColumn =
      columns.find((col) => !numericColumns.includes(col)) || "index";

    return {
      type: "bar",
      x: xColumn,
      y: numericColumns[0],
      title: `${numericColumns[0].replace(/_/g, " ")} Distribution`,
      useIndex: xColumn === "index",
    };
  }

  return null;
};

// Format data for charts
const formatChartData = (data: any[], vizConfig: any) => {
  if (!vizConfig || !data) return [];

  try {
    switch (vizConfig.type) {
      case "line":
        return data.map((row, index) => {
          const xValue = row[vizConfig.x];
          let formattedX = String(xValue);

          // Format dates nicely
          if (
            xValue &&
            typeof xValue === "string" &&
            !isNaN(Date.parse(xValue))
          ) {
            const date = new Date(xValue);
            formattedX = date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
            });
          }

          const yValue = parseFloat(row[vizConfig.y]);

          return {
            ...row,
            [vizConfig.x]: formattedX,
            [vizConfig.y]: yValue || 0,
            originalIndex: index,
          };
        });

      case "bar":
        return data.map((row, index) => {
          const xValue = vizConfig.useIndex
            ? `Row ${index + 1}`
            : String(row[vizConfig.x] || "").slice(0, 20);

          const yValue = parseFloat(row[vizConfig.y]);

          return {
            ...row,
            [vizConfig.x]: xValue,
            [vizConfig.y]: yValue || 0,
            originalIndex: index,
          };
        });

      case "pie":
        return data.map((row) => ({
          name: String(row[vizConfig.label] || "Unknown").slice(0, 20),
          value: parseFloat(row[vizConfig.value]) || 0,
        }));

      default:
        return data;
    }
  } catch (error) {
    console.error("Error formatting chart data:", error);
    return [];
  }
};

// Color palette
const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

interface DataVisualizationProps {
  data: any[];
}

export default function DataVisualization({ data }: DataVisualizationProps) {
  const vizConfig = useMemo(() => {
    const config = detectVisualizationType(data);
    return config;
  }, [data]);

  const chartData = useMemo(() => {
    const formatted = formatChartData(data, vizConfig);
    return formatted;
  }, [data, vizConfig]);

  if (!vizConfig || !chartData || chartData.length === 0) {
    return (
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg text-center text-gray-500 dark:text-gray-400">
        <svg
          className="mx-auto h-12 w-12 mb-3 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="font-medium">No visualization available for this data</p>
        <p className="text-sm mt-1">
          Visualizations work best with time-series or categorical data
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {vizConfig.title}
      </h3>

      <div className="w-full" style={{ overflowX: "auto" }}>
        {vizConfig.type === "line" && (
          <ResponsiveContainer width="100%" height={400} minWidth={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey={vizConfig.x}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey={vizConfig.y}
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {vizConfig.type === "bar" && (
          <ResponsiveContainer width="100%" height={400} minWidth={300}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey={vizConfig.x}
                tick={{ fontSize: 11, fill: "#6B7280" }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey={vizConfig.y} radius={[8, 8, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {vizConfig.type === "pie" && (
          <ResponsiveContainer width="100%" height={400} minWidth={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          💡 This chart was automatically generated based on your data
          structure.
          {vizConfig.type === "line" && " Perfect for seeing trends over time."}
          {vizConfig.type === "bar" && " Great for comparing categories."}
          {vizConfig.type === "pie" && " Ideal for showing distribution."}
        </p>
      </div>
    </div>
  );
}
