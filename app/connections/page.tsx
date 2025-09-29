// app/connections/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Database,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import AppNav from "@/components/AppNav";

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database: string;
  username: string;
  isActive: boolean;
  lastTestedAt: string | null;
  testStatus: string;
  createdAt: string;
}

export default function ConnectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConnections();
    }
  }, [status]);

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
    if (!confirm("Are you sure you want to delete this connection?")) {
      return;
    }

    try {
      const response = await fetch(`/api/connections/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setConnections(connections.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete connection:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppNav />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppNav />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Database Connections
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Manage your database connections securely
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No connections
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first database connection.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                      <Database className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {connection.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                        {connection.type}
                      </p>
                    </div>
                  </div>

                  {connection.testStatus === "success" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : connection.testStatus === "failed" ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Host:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {connection.host}:{connection.port}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Database:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {connection.database}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      User:{" "}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {connection.username}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {connection.lastTestedAt
                      ? `Tested ${new Date(
                          connection.lastTestedAt
                        ).toLocaleDateString()}`
                      : "Not tested"}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => deleteConnection(connection.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      {showAddModal && (
        <AddConnectionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchConnections();
          }}
        />
      )}
    </div>
  );
}

// Add Connection Modal Component
function AddConnectionModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [connectionMode, setConnectionMode] = useState<"manual" | "url">("url");
  const [connectionUrl, setConnectionUrl] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "postgresql",
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
    ssl: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    setTestResult(null);
    setError("");
  };

  const parseConnectionUrl = (url: string) => {
    try {
      // Handle postgres:// and postgresql://
      const normalizedUrl = url.replace(/^postgres:\/\//, "postgresql://");
      const urlObj = new URL(normalizedUrl);

      // Extract database name (remove leading slash and any query params)
      const database = urlObj.pathname.substring(1).split("?")[0];

      return {
        type: "postgresql",
        username: decodeURIComponent(urlObj.username),
        password: decodeURIComponent(urlObj.password),
        host: urlObj.hostname,
        port: urlObj.port || "5432",
        database: database,
        ssl:
          urlObj.searchParams.has("sslmode") ||
          urlObj.searchParams.has("ssl") ||
          url.includes("sslmode=require"),
        connectionUrl: url, // Keep original URL for API
      };
    } catch (error) {
      throw new Error(
        "Invalid connection URL format. Expected: postgresql://user:pass@host:port/database"
      );
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError("");

    try {
      let testData;

      if (connectionMode === "url") {
        if (!connectionUrl) {
          setError("Please enter a connection URL");
          setTesting(false);
          return;
        }

        try {
          const parsed = parseConnectionUrl(connectionUrl);
          testData = { ...formData, ...parsed };
        } catch (error: any) {
          setError(error.message);
          setTesting(false);
          return;
        }
      } else {
        testData = formData;
      }

      const response = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful!" });

        // If using URL mode, populate the form fields for saving
        if (connectionMode === "url") {
          const parsed = parseConnectionUrl(connectionUrl);
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
      } else {
        setTestResult({
          success: false,
          message: data.message || "Connection failed",
        });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Failed to test connection" });
    } finally {
      setTesting(false);
    }
  };

  const saveConnection = async () => {
    if (!testResult?.success) {
      setError("Please test the connection first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();

        // Check if it's a limit error
        if (response.status === 403) {
          setError(
            <div>
              {data.message}{" "}
              <a href="/billing" className="underline font-semibold">
                Upgrade now
              </a>
            </div>
          );
        } else {
          setError(data.message || "Failed to save connection");
        }
      }
    } catch (error) {
      setError("Failed to save connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Database Connection
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect your PostgreSQL database securely
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {testResult && (
            <div
              className={`border px-4 py-3 rounded-md text-sm ${
                testResult.success
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
              }`}
            >
              <div className="flex items-center">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {testResult.message}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Connection Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="My Production DB"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          {/* Connection Mode Toggle */}
          <div className="flex items-center justify-center space-x-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <button
              type="button"
              onClick={() => setConnectionMode("url")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                connectionMode === "url"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Connection URL
            </button>
            <button
              type="button"
              onClick={() => setConnectionMode("manual")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                connectionMode === "manual"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Manual Entry
            </button>
          </div>

          {connectionMode === "url" ? (
            // URL Mode
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Connection URL
              </label>
              <input
                type="text"
                value={connectionUrl}
                onChange={(e) => {
                  setConnectionUrl(e.target.value);
                  setTestResult(null);
                  setError("");
                }}
                placeholder="postgresql://user:password@host:5432/database?sslmode=require"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Works with Neon, Supabase, Railway, and other hosted databases
              </p>
            </div>
          ) : (
            // Manual Mode
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Database Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql" disabled>
                    MySQL (Coming Soon)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Host
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleInputChange}
                    placeholder="localhost"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Port
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleInputChange}
                    placeholder="5432"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Database Name
                </label>
                <input
                  type="text"
                  name="database"
                  value={formData.database}
                  onChange={handleInputChange}
                  placeholder="mydb"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="postgres"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ssl"
                  id="ssl"
                  checked={formData.ssl}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="ssl"
                  className="ml-2 block text-sm text-gray-900 dark:text-white"
                >
                  Use SSL Connection
                </label>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              onClick={testConnection}
              disabled={
                testing ||
                (!connectionUrl && connectionMode === "url") ||
                (!formData.host && connectionMode === "manual")
              }
              className="px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </button>
            <button
              onClick={saveConnection}
              disabled={saving || !testResult?.success}
              className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Connection"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
