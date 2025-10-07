import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ResultsTableProps {
  results: any[];
  onExport: () => void;
}

export default function ResultsTable({
  results,
  onExport,
}: Readonly<ResultsTableProps>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (!results || results.length === 0) return null;

  const headers = Object.keys(results[0]);
  const totalRows = results.length;
  const shouldPaginate = totalRows > 10;

  // Calculate pagination
  const totalPages = Math.ceil(totalRows / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRows);
  const paginatedResults = shouldPaginate
    ? results.slice(startIndex, endIndex)
    : results;

  // Reset to page 1 if page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-3">
      {/* Header with Export and Page Size */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {shouldPaginate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Rows per page:
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <button
          onClick={onExport}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors ml-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {headers.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {String(key).split("_").join(" ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedResults.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {headers.map((key) => (
                      <td
                        key={key}
                        className="px-4 py-3 text-sm text-gray-900 dark:text-white"
                      >
                        <div
                          className="max-w-xs truncate"
                          title={
                            row[key] === null || row[key] === undefined
                              ? "-"
                              : String(row[key])
                          }
                        >
                          {row[key] === null || row[key] === undefined
                            ? "-"
                            : String(row[key])}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {shouldPaginate && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {endIndex}
            </span>{" "}
            of{" "}
            <span className="font-medium text-gray-900 dark:text-white">
              {totalRows}
            </span>{" "}
            results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {currentPage}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900 dark:text-white">
                  {totalPages}
                </span>
              </span>
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
