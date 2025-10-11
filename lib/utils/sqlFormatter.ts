// lib/utils/sqlFormatter.ts

/**
 * Format SQL for better display
 */
export function formatSQL(sql: string): string {
  if (!sql) return "";

  // Keywords to uppercase and add line breaks
  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
    "OUTER JOIN",
    "ON",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "OFFSET",
    "INSERT",
    "UPDATE",
    "DELETE",
    "CREATE",
    "ALTER",
    "DROP",
    "WITH",
    "AS",
    "UNION",
    "INTERSECT",
    "EXCEPT",
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
  ];

  let formatted = sql;

  // Add line breaks before major clauses
  const majorClauses = [
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "INNER JOIN",
  ];

  majorClauses.forEach((clause) => {
    const regex = new RegExp(`\\s+(${clause})\\s+`, "gi");
    formatted = formatted.replace(regex, `\n${clause} `);
  });

  // Uppercase keywords
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, keyword);
  });

  // Clean up multiple spaces and trim
  formatted = formatted.replace(/\s+/g, " ").trim();

  return formatted;
}

/**
 * Extract table names from SQL query
 */
export function extractTableNames(sql: string): string[] {
  const tables: Set<string> = new Set();

  // Match FROM and JOIN clauses
  const fromRegex = /FROM\s+([`"]?\w+[`"]?)(?:\s+AS\s+\w+)?/gi;
  const joinRegex = /JOIN\s+([`"]?\w+[`"]?)(?:\s+AS\s+\w+)?/gi;

  let match;

  while ((match = fromRegex.exec(sql)) !== null) {
    tables.add(match[1].replace(/[`"]/g, ""));
  }

  while ((match = joinRegex.exec(sql)) !== null) {
    tables.add(match[1].replace(/[`"]/g, ""));
  }

  return Array.from(tables);
}

/**
 * Estimate query complexity
 */
export function estimateQueryComplexity(
  sql: string
): "simple" | "moderate" | "complex" {
  const upperSQL = sql.toUpperCase();

  const complexityScore =
    (upperSQL.includes("JOIN") ? 2 : 0) +
    (upperSQL.includes("GROUP BY") ? 1 : 0) +
    (upperSQL.includes("HAVING") ? 1 : 0) +
    (upperSQL.includes("UNION") ? 2 : 0) +
    (upperSQL.includes("SUBQUERY") || upperSQL.includes("EXISTS") ? 2 : 0) +
    (upperSQL.includes("WITH") ? 2 : 0);

  if (complexityScore >= 4) return "complex";
  if (complexityScore >= 2) return "moderate";
  return "simple";
}

/**
 * Add export functionality for results
 */
export function exportToCSV(
  data: any[],
  filename: string = "query_results.csv"
) {
  if (!data || data.length === 0) return;

  // Get headers
  const headers = Object.keys(data[0]);

  // Build CSV content
  let csv = headers.join(",") + "\n";

  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csv += values.join(",") + "\n";
  });

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(
  data: any[],
  filename: string = "query_results.json"
) {
  if (!data || data.length === 0) return;

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], filename: string = "query_results") {
  // This would require the xlsx library
  // For now, we'll export as CSV with .xls extension
  exportToCSV(data, `${filename}.xls`);
}
