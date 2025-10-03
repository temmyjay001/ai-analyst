import { Download } from "lucide-react";

interface ResultsTableProps {
  results: any[];
  onExport: () => void;
}

export default function ResultsTable({ results, onExport }: Readonly<ResultsTableProps>) {
  if (!results || results.length === 0) return null;

  const headers = Object.keys(results[0]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {headers.map((key) => (
                  <td
                    key={key}
                    className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap"
                  >
                    {row[key] === null || row[key] === undefined
                      ? "-"
                      : String(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
