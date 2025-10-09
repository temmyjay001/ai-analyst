// components/ExportMenu.tsx
import React, { useState } from "react";
import { Download, Link, Mail, Check, FileJson, FileText } from "lucide-react";
import { ExportUtils } from "@/lib/exportUtils";
import { QueryHistoryItem } from "@/types/query";

interface ExportMenuProps {
  query: QueryHistoryItem;
  onClose?: () => void;
}

export default function ExportMenu({ query, onClose }: Readonly<ExportMenuProps>) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    const success = await ExportUtils.copyShareableLink(query);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCSVExport = () => {
    if (query.results) {
      ExportUtils.downloadCSV(query.results, "fintech-query");
    }
  };

  const handleJSONExport = () => {
    ExportUtils.downloadJSON(query, "fintech-query");
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
      <button
        onClick={handleCSVExport}
        disabled={!query.results || query.results.length === 0}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
      >
        <FileText className="h-4 w-4" />
        <span>Export as CSV</span>
      </button>

      <button
        onClick={handleJSONExport}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3"
      >
        <FileJson className="h-4 w-4" />
        <span>Export as JSON</span>
      </button>

      <div className="border-t border-gray-200 my-2"></div>

      <button
        onClick={handleCopyLink}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3"
      >
        <Link className="h-4 w-4" />
        <span>{copied ? "Link Copied!" : "Copy Share Link"}</span>
        {copied && <Check className="h-4 w-4 text-green-500 ml-auto" />}
      </button>

      <button
        onClick={() => {
          const subject = encodeURIComponent(
            `Query Results: ${query.question}`
          );
          const body = encodeURIComponent(
            `View the query results here: ${ExportUtils.generateShareableLink(
              query
            )}`
          );
          window.location.href = `mailto:?subject=${subject}&body=${body}`;
        }}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-3"
      >
        <Mail className="h-4 w-4" />
        <span>Email Results</span>
      </button>
    </div>
  );
}
