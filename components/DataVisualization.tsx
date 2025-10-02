// components/DataVisualization.tsx - PRODUCTION FIXED VERSION
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

const CustomTooltip = ({ active, payload, label, valueFormatter }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600">
      <p className="font-semibold text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
            {String(entry.name).split("_").join(" ")}:
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const formatLegendLabel = (label: string) => {
  return label
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Custom Legend Component with better styling
const CustomLegend = ({ payload, chartData, valueFormatter }: any) => {
  if (!payload || payload.length === 0) return null;

  // Calculate totals/stats for the legend
  const calculateStats = (dataKey: string) => {
    if (!chartData) return null;

    const values = chartData
      .map((item: any) => item[dataKey])
      .filter((val: any) => val !== null && val !== undefined);

    if (values.length === 0) return null;

    const sum = values.reduce((acc: number, val: number) => acc + val, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { sum, avg, max, min, count: values.length };
  };

  return (
    <div className="flex flex-wrap justify-center gap-6 pt-4 px-4">
      {payload.map((entry: any, index: number) => {
        const stats = calculateStats(entry.dataKey);
        const label = formatLegendLabel(entry.dataKey);

        return (
          <div
            key={`legend-${index}`}
            className="flex flex-col items-start gap-1 bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg"
          >
            {/* Legend label with color indicator */}
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {label}
              </span>
            </div>

            {/* Stats if available */}
            {stats && (
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5 ml-6">
                <div>
                  Total:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {valueFormatter
                      ? valueFormatter(stats.sum)
                      : formatNumber(stats.sum)}
                  </span>
                </div>
                <div>
                  Avg:{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {valueFormatter
                      ? valueFormatter(stats.avg)
                      : formatNumber(stats.avg)}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span>
                    Min:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {valueFormatter
                        ? valueFormatter(stats.min)
                        : formatNumber(stats.min)}
                    </span>
                  </span>
                  <span>
                    Max:{" "}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {valueFormatter
                        ? valueFormatter(stats.max)
                        : formatNumber(stats.max)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Format numbers with commas
const formatNumber = (value: number) => {
  if (value === null || value === undefined) return "0";

  // If it's a whole number, don't show decimals
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  // If it's a decimal, show up to 2 decimal places
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

// Format currency if the column name suggests it
const formatValue = (value: number, columnName: string) => {
  const lowerCol = columnName.toLowerCase();

  if (
    lowerCol.includes("amount") ||
    lowerCol.includes("price") ||
    lowerCol.includes("cost") ||
    lowerCol.includes("revenue") ||
    lowerCol.includes("profit")
  ) {
    return `$${formatNumber(value)}`;
  }

  if (lowerCol.includes("percent") || lowerCol.includes("rate")) {
    return `${formatNumber(value)}%`;
  }

  return formatNumber(value);
};

const detectVisualizationType = (data: any[]) => {
  if (!data || data.length === 0) {
    console.log("❌ No data provided");
    return null;
  }

  const columns = Object.keys(data[0]);
  if (columns.length === 0) {
    console.log("❌ No columns found");
    return null;
  }

  console.log("🔍 Detection started:", {
    columns,
    rowCount: data.length,
    sampleRow: data[0],
  });

  // Date column detection with YYYY-MM support
  const dateColumns = columns.filter((col) => {
    const colLower = col.toLowerCase();

    const hasDateKeyword =
      colLower.includes("date") ||
      colLower.includes("month") ||
      colLower.includes("year") ||
      colLower.includes("day") ||
      colLower.includes("created") ||
      colLower.includes("updated") ||
      colLower.includes("timestamp") ||
      colLower.includes("time");

    if (!hasDateKeyword) return false;

    const sampleValue = data[0][col];
    if (!sampleValue || typeof sampleValue !== "string") return false;

    // Support multiple date formats
    const isISODate = /^\d{4}-\d{2}-\d{2}/.test(sampleValue); // 2024-09-01
    const isMonthYear = /^\d{4}-\d{2}$/.test(sampleValue); // 2024-09 ✅ YOUR FORMAT
    const hasTimeComponent =
      sampleValue.includes("T") || sampleValue.includes(":");

    return isISODate || isMonthYear || hasTimeComponent;
  });

  // Numeric column detection - robust against string numbers
  const numericColumns = columns.filter((col) => {
    const sample = data[0][col];
    if (sample === null || sample === undefined) return false;

    let isNumeric = false;

    if (typeof sample === "number") {
      isNumeric = true;
    } else if (typeof sample === "string") {
      const cleaned = sample.replace(/,/g, "");
      const parsed = parseFloat(cleaned);
      isNumeric = !isNaN(parsed);
    }

    const isDateCol = dateColumns.includes(col);
    const isIdColumn = col.toLowerCase().includes("id");

    return isNumeric && !isDateCol && !isIdColumn;
  });

  // Categorical detection
  const categoricalColumns = columns.filter((col) => {
    const sample = data[0][col];
    const isString = typeof sample === "string";
    const cleaned = String(sample).replace(/,/g, "");
    const isNotNumeric = isNaN(parseFloat(cleaned));
    const isNotDate = !dateColumns.includes(col);

    return isString && isNotNumeric && isNotDate;
  });

  console.log("📊 Detection complete:", {
    dateColumns,
    numericColumns,
    categoricalColumns,
  });

  // PRIORITY 1: Time series → LINE chart
  if (dateColumns.length > 0 && numericColumns.length > 0) {
    const preferredNumeric =
      numericColumns.find((col) => {
        const lower = col.toLowerCase();
        return (
          lower.includes("count") ||
          lower.includes("amount") ||
          lower.includes("total") ||
          lower.includes("sum") ||
          lower.includes("avg") ||
          lower.includes("number")
        );
      }) || numericColumns[0];

    console.log("✅ Using LINE chart for time series");
    return {
      type: "line",
      x: dateColumns[0],
      y: preferredNumeric,
      title: `${preferredNumeric.replace(/_/g, " ")} over Time`,
    };
  }

  // PRIORITY 2: Categorical comparison → BAR chart
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length > 0 &&
    data.length <= 20
  ) {
    console.log("✅ Using BAR chart for categories");
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

  // PRIORITY 3: Distribution → PIE chart
  if (
    categoricalColumns.length > 0 &&
    numericColumns.length > 0 &&
    data.length <= 10
  ) {
    console.log("✅ Using PIE chart for distribution");
    return {
      type: "pie",
      label: categoricalColumns[0],
      value: numericColumns[0],
      title: `Distribution of ${numericColumns[0].replace(/_/g, " ")}`,
    };
  }

  // FALLBACK: Bar chart with any numeric
  if (numericColumns.length > 0 && data.length <= 20) {
    const xColumn =
      columns.find((col) => !numericColumns.includes(col)) || "index";
    console.log("✅ Using FALLBACK bar chart");
    return {
      type: "bar",
      x: xColumn,
      y: numericColumns[0],
      title: `${numericColumns[0].replace(/_/g, " ")} Distribution`,
      useIndex: xColumn === "index",
    };
  }

  console.log("❌ No visualization possible");
  return null;
};

// FIXED: Clean data formatting without spreading original row
const formatChartData = (data: any[], vizConfig: any) => {
  if (!vizConfig || !data) return [];

  try {
    switch (vizConfig.type) {
      case "line":
      case "bar":
        return data.map((row, index) => {
          let xValue = row[vizConfig.x];

          // Format dates for display
          const isDateColumn =
            vizConfig.x &&
            (vizConfig.x.toLowerCase().includes("date") ||
              vizConfig.x.toLowerCase().includes("time") ||
              vizConfig.x.toLowerCase().includes("month") ||
              vizConfig.x.toLowerCase().includes("created") ||
              vizConfig.x.toLowerCase().includes("updated"));

          if (isDateColumn && xValue) {
            const date = new Date(xValue);
            if (!isNaN(date.getTime())) {
              const monthNames = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ];
              xValue = `${
                monthNames[date.getUTCMonth()]
              } ${date.getUTCFullYear()}`;
            }
          }

          // CRITICAL: Create clean object - no spreading
          const chartPoint: any = {};

          // X-axis: formatted string
          chartPoint[vizConfig.x] = String(xValue || "").slice(0, 20);

          // Y-axis: MUST be number for correct chart rendering
          const yValue = row[vizConfig.y];
          if (typeof yValue === "number") {
            chartPoint[vizConfig.y] = yValue;
          } else {
            // Parse string, removing commas
            const cleaned = String(yValue).replace(/,/g, "");
            chartPoint[vizConfig.y] = parseFloat(cleaned) || 0;
          }

          console.log(`📈 Point ${index}:`, chartPoint);
          return chartPoint;
        });

      case "pie":
        return data.map((row, index) => {
          const labelValue = row[vizConfig.label];
          const numValue = row[vizConfig.value];

          let value = 0;
          if (typeof numValue === "number") {
            value = numValue;
          } else {
            const cleaned = String(numValue).replace(/,/g, "");
            value = parseFloat(cleaned) || 0;
          }

          return {
            name: String(labelValue || "Unknown"),
            value,
          };
        });

      default:
        return data;
    }
  } catch (error) {
    console.error("❌ Error formatting chart data:", error);
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

export default function DataVisualization({
  data,
}: Readonly<DataVisualizationProps>) {
  const vizConfig = useMemo(() => {
    const config = detectVisualizationType(data);
    console.log("✅ Final config:", config);
    return config;
  }, [data]);

  const chartData = useMemo(() => {
    const formatted = formatChartData(data, vizConfig);
    console.log("✅ Formatted data points:", formatted.length);
    if (formatted.length > 0) {
      console.log("✅ First point:", formatted[0]);
      console.log("✅ Last point:", formatted[formatted.length - 1]);
    }
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="font-medium">No visualization available</p>
        <p className="text-sm mt-1">
          Visualizations work best with time-series or categorical data
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
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
                content={
                  <CustomTooltip
                    valueFormatter={(value: number) =>
                      formatValue(value, vizConfig.y as string)
                    }
                  />
                }
              />
              <Legend
                content={
                  <CustomLegend
                    chartData={chartData}
                    valueFormatter={(value: number) =>
                      formatValue(value, vizConfig.y as string)
                    }
                  />
                }
              />
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
                content={
                  <CustomTooltip
                    valueFormatter={(value: number) =>
                      formatValue(value, vizConfig.y as string)
                    }
                  />
                }
              />
              {/* <Legend
                className="capitalize"
                wrapperStyle={{ paddingTop: "20px" }}
              /> */}
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
              <Tooltip
                content={({ active, payload }: any) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0];
                  return (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-600">
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">
                        {data.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Value:{" "}
                        <span className="font-bold text-gray-900 dark:text-white">
                          {formatNumber(data.value)}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {(
                          (data.value /
                            chartData.reduce(
                              (sum: number, item: any) => sum + item.value,
                              0
                            )) *
                          100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  );
                }}
              />
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
