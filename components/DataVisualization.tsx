// components/DataVisualization.tsx - FIXED: Auto-detect columns
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

// Visualization type detection
const detectVisualizationType = (data: any[]) => {
  if (!data || data.length === 0) {
    return null;
  }

  // Get columns from first row
  const columns = Object.keys(data[0]);

  if (columns.length === 0) {
    return null;
  }

  // Check for time series
  const dateColumns = columns.filter(
    (col) =>
      col.toLowerCase().includes("date") ||
      col.toLowerCase().includes("time") ||
      col.toLowerCase().includes("created") ||
      col.toLowerCase().includes("updated")
  );

  const numericColumns = columns.filter((col) => {
    const sample = data[0][col];
    return typeof sample === "number" || !isNaN(parseFloat(sample));
  });

  const categoricalColumns = columns.filter((col) => {
    const sample = data[0][col];
    return typeof sample === "string" && isNaN(parseFloat(sample));
  });

  // Time series detection
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    return {
      type: "line",
      x: dateColumns[0],
      y: numericColumns[0],
      title: `${numericColumns[0]} over Time`,
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
      title: `${numericColumns[0]} by ${categoricalColumns[0]}`,
    };
  }

  // Distribution (pie chart) - for small datasets with categories
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length > 0 &&
    data.length <= 10
  ) {
    return {
      type: "pie",
      label: categoricalColumns[0],
      value: numericColumns[0],
      title: `Distribution of ${numericColumns[0]}`,
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
      case "bar":
        return data.map((row) => ({
          ...row,
          [vizConfig.x]: String(row[vizConfig.x] || "").slice(0, 20),
          [vizConfig.y]: parseFloat(row[vizConfig.y]) || 0,
        }));

      case "pie":
        return data.map((row) => ({
          name: String(row[vizConfig.label] || "Unknown"),
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
  const vizConfig = useMemo(() => detectVisualizationType(data), [data]);

  const chartData = useMemo(
    () => formatChartData(data, vizConfig),
    [data, vizConfig]
  );

  if (!vizConfig || !chartData || chartData.length === 0) {
    return (
      <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500">
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
        <p className="text-sm mt-1 text-gray-400">
          Visualizations work best with time-series or categorical data
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {vizConfig.title}
      </h3>

      <div className="w-full" style={{ overflowX: "auto" }}>
        <ResponsiveContainer width="100%" height={400} minWidth={300}>
          <>
            {vizConfig.type === "line" && (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey={vizConfig.x}
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fontSize: 11 }} />
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
                  dot={{ fill: "#3B82F6", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            )}

            {vizConfig.type === "bar" && (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey={vizConfig.x}
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
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
            )}

            {vizConfig.type === "pie" && (
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
            )}
          </>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
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
