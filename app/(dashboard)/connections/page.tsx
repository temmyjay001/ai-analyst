// app/(dashboard)/connections/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  TestTube,
  X,
} from "lucide-react";
import ConnectionForm from "@/components/ConnectionForm";

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string | null;
  port: number | null;
  database: string | null;
  username: string | null;
  isActive: boolean;
  lastTestedAt: string | null;
  testStatus: string;
  createdAt: string;
}

// Database type colors and icons
const DB_STYLES = {
  postgresql: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900",
    label: "PostgreSQL",
  },
  mysql: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900",
    label: "MySQL",
  },
  mssql: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900",
    label: "SQL Server",
  },
  sqlite: {
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-900",
    label: "SQLite",
  },
};

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch("/api/connections");
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error("Failed to fetch connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this connection?")) return;

    try {
      const response = await fetch(`/api/connections/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConnections((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete connection:", error);
      alert("Failed to delete connection");
    }
  };

  const testConnection = async (connection: DatabaseConnection) => {
    setTestingId(connection.id);

    try {
      const payload = {
        type: connection.type,
        ...(connection.host
          ? {
              host: connection.host,
              port: connection.port,
              database: connection.database,
              username: connection.username,
              password: "test", // Will use encrypted password from backend
            }
          : {
              connectionUrl: "test", // Will use encrypted URL from backend
            }),
      };

      const response = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("✅ Connection test successful!");
        fetchConnections(); // Refresh to update test status
      } else {
        alert(`❌ Connection test failed: ${data.message}`);
      }
    } catch (error: any) {
      alert(`❌ Connection test failed: ${error.message}`);
    } finally {
      setTestingId(null);
    }
  };

  const getDbStyle = (type: string) => {
    return DB_STYLES[type as keyof typeof DB_STYLES] || DB_STYLES.postgresql;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Database Connections
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage connections to PostgreSQL, MySQL, and SQL Server
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Connection
          </button>
        </div>

        {/* Empty State */}
        {connections.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No connections yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect to PostgreSQL, MySQL, SQL Server, or SQLite to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Connection
            </button>
          </div>
        ) : (
          /* Connections Grid */
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map((connection) => {
              const dbStyle = getDbStyle(connection.type);

              return (
                <div
                  key={connection.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 ${dbStyle.bg} rounded-lg`}>
                        <Database className={`h-6 w-6 ${dbStyle.color}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {connection.name}
                        </h3>
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mt-1">
                          {dbStyle.label}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center space-x-2">
                      {connection.testStatus === "success" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : connection.testStatus === "failed" ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* Connection Details */}
                  <div className="space-y-1 mb-4">
                    {connection.host && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Host:</span>{" "}
                        {connection.host}
                        {connection.port && `:${connection.port}`}
                      </p>
                    )}
                    {connection.database && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Database:</span>{" "}
                        {connection.database}
                      </p>
                    )}
                    {connection.username && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">User:</span>{" "}
                        {connection.username}
                      </p>
                    )}
                    {connection.lastTestedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Last tested:{" "}
                        {new Date(connection.lastTestedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        router.push(`/app?connection=${connection.id}`)
                      }
                      className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      Use Connection
                    </button>
                    <button
                      onClick={() => testConnection(connection)}
                      disabled={testingId === connection.id}
                      className="hidden px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      {testingId === connection.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteConnection(connection.id)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Connection Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Add New Connection
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Connect to any supported database type
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <ConnectionForm
                  onSuccess={() => {
                    setShowAddModal(false);
                    fetchConnections();
                  }}
                  onCancel={() => setShowAddModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
