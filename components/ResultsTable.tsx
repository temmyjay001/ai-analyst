// components/ResultsTable.tsx
"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Download, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  exportToCSV,
  exportToJSON,
  exportToExcel,
} from "@/lib/utils/sqlFormatter";
import { cn } from "@/lib/utils";

interface ResultsTableProps {
  data: any[];
  className?: string;
  showExport?: boolean;
  pageSize?: number;
}

export default function ResultsTable({
  data,
  className,
  showExport = true,
  pageSize = 100,
}: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Pagination
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize]);

  // Get column names
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Determine column types
  const columnTypes = useMemo(() => {
    if (!data || data.length === 0) return {};

    const types: Record<string, string> = {};
    columns.forEach((col) => {
      const sampleValue = data.find((row) => row[col] !== null)?.[col];
      if (sampleValue === undefined || sampleValue === null) {
        types[col] = "null";
      } else if (typeof sampleValue === "number") {
        types[col] = "number";
      } else if (typeof sampleValue === "boolean") {
        types[col] = "boolean";
      } else if (!isNaN(Date.parse(sampleValue))) {
        types[col] = "date";
      } else {
        types[col] = "string";
      }
    });
    return types;
  }, [data, columns]);

  const handleCopyCell = (value: any, cellId: string) => {
    const text = value === null ? "NULL" : String(value);
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedCell(null), 2000);
  };

  const handleCopyTable = () => {
    const headers = columns.join("\t");
    const rows = data
      .map((row) =>
        columns
          .map((col) => (row[col] === null ? "NULL" : String(row[col])))
          .join("\t")
      )
      .join("\n");
    const tableText = `${headers}\n${rows}`;

    navigator.clipboard.writeText(tableText);
    toast.success("Table copied to clipboard");
  };

  const formatCellValue = (value: any, type: string) => {
    if (value === null) {
      return <span className="text-muted-foreground italic">NULL</span>;
    }

    switch (type) {
      case "number":
        return (
          <span className="font-mono">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
        );
      case "boolean":
        return (
          <Badge variant={value ? "default" : "secondary"}>
            {String(value)}
          </Badge>
        );
      case "date":
        try {
          const date = new Date(value);
          return (
            <span className="font-mono">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          );
        } catch {
          return String(value);
        }
      default:
        return String(value);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results to display
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {data.length} row{data.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline">
            {columns.length} column{columns.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {showExport && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyTable}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToCSV(data)}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToJSON(data)}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(data)}>
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Table */}
      <ScrollArea className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  {column}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({columnTypes[column]})
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column) => {
                  const cellId = `${rowIndex}-${column}`;
                  const iscopied = copiedCell === cellId;

                  return (
                    <TableCell
                      key={column}
                      className={cn(
                        "relative group cursor-pointer",
                        iscopied && "bg-green-50 dark:bg-green-950/20"
                      )}
                      onClick={() => handleCopyCell(row[column], cellId)}
                    >
                      {formatCellValue(row[column], columnTypes[column])}
                      {iscopied && (
                        <span className="absolute top-1 right-1 text-xs text-green-600">
                          Copied!
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, data.length)} of {data.length}{" "}
            rows
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3 w-3" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
