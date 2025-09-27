// lib/exportUtils.ts
import { QueryHistoryItem } from "@/types/query";

export class ExportUtils {
  /**
   * Convert query results to CSV format
   */
  static resultsToCSV(results: any[]): string {
    if (!results || results.length === 0) return "";

    // Get headers from first row
    const headers = Object.keys(results[0]);
    const csvHeaders = headers.join(",");

    // Convert each row to CSV
    const csvRows = results.map((row) => {
      return headers
        .map((header) => {
          const value = row[header];
          // Handle special cases
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    return [csvHeaders, ...csvRows].join("\n");
  }

  /**
   * Download CSV file
   */
  static downloadCSV(results: any[], filename: string = "query-results"): void {
    const csv = this.resultsToCSV(results);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${Date.now()}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generate shareable link for a query
   */
  static generateShareableLink(query: QueryHistoryItem): string {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      q: query.question,
      id: query.id,
      t: query.timestamp.toString(),
    });
    return `${baseUrl}/share?${params.toString()}`;
  }

  /**
   * Copy shareable link to clipboard
   */
  static async copyShareableLink(query: QueryHistoryItem): Promise<boolean> {
    const link = this.generateShareableLink(query);
    try {
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error("Failed to copy link:", err);
      return false;
    }
  }

  /**
   * Export results as JSON
   */
  static downloadJSON(
    query: QueryHistoryItem,
    filename: string = "query-results"
  ): void {
    const exportData = {
      question: query.question,
      sql: query.sql,
      timestamp: query.timestamp,
      execution_time: query.execution_time,
      row_count: query.results?.length || 0,
      results: query.results,
      interpretation: query.interpretation,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}-${Date.now()}.json`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}