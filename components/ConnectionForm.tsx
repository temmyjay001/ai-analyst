// components/ConnectionForm.tsx
"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type DatabaseType = "postgresql" | "mysql" | "mssql" | "sqlite";

interface ConnectionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DATABASE_INFO = {
  postgresql: {
    name: "PostgreSQL",
    defaultPort: 5432,
    placeholder: {
      host: "localhost or db.example.com",
      port: "5432",
      database: "mydb",
      username: "postgres",
      connectionUrl: "postgresql://user:password@host:5432/dbname",
    },
    description: "Open-source relational database",
    urlExample:
      "postgresql://username:password@hostname:5432/database_name?sslmode=require",
  },
  mysql: {
    name: "MySQL",
    defaultPort: 3306,
    placeholder: {
      host: "localhost or db.example.com",
      port: "3306",
      database: "mydb",
      username: "root",
      connectionUrl: "mysql://user:password@host:3306/dbname",
    },
    description: "Popular open-source database",
    urlExample: "mysql://username:password@hostname:3306/database_name",
  },
  mssql: {
    name: "SQL Server",
    defaultPort: 1433,
    placeholder: {
      host: "localhost or server.database.windows.net",
      port: "1433",
      database: "mydb",
      username: "sa",
      connectionUrl:
        "Server=myServerAddress;Database=myDataBase;User Id=myUsername;Password=myPassword;",
    },
    description: "Microsoft SQL Server",
    urlExample:
      "Server=hostname,1433;Database=database_name;User Id=username;Password=password;Encrypt=true;",
  },
  sqlite: {
    name: "SQLite",
    defaultPort: 0,
    placeholder: {
      host: "",
      port: "",
      database: "/path/to/database.db",
      username: "",
      connectionUrl: "sqlite:///path/to/database.db",
    },
    description: "Lightweight file-based database",
    urlExample:
      "sqlite:///absolute/path/to/database.db or file:/path/to/database.db",
  },
};

export default function ConnectionForm({
  onSuccess,
  onCancel,
}: Readonly<ConnectionFormProps>) {
  const [dbType, setDbType] = useState<DatabaseType>("postgresql");
  const [connectionMode, setConnectionMode] = useState<"url" | "fields">("url");
  const [formData, setFormData] = useState({
    name: "",
    host: "",
    port: "",
    database: "",
    username: "",
    password: "",
    connectionUrl: "",
    ssl: false,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const dbInfo = DATABASE_INFO[dbType];
  const isSQLite = dbType === "sqlite";

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  // Validation: Check if all required fields are filled
  const isFormValid = () => {
    if (isSQLite) {
      // SQLite only needs database path
      return formData.database.trim() !== "";
    }

    if (connectionMode === "url") {
      // URL mode needs connection URL
      return formData.connectionUrl.trim() !== "";
    }

    // Individual fields mode needs all fields
    return (
      formData.host.trim() !== "" &&
      formData.port.trim() !== "" &&
      formData.database.trim() !== "" &&
      formData.username.trim() !== "" &&
      formData.password.trim() !== ""
    );
  };

  const handleDbTypeChange = (type: DatabaseType) => {
    setDbType(type);
    setFormData({
      name: "",
      host: "",
      port: DATABASE_INFO[type].defaultPort.toString(),
      database: "",
      username: "",
      password: "",
      connectionUrl: "",
      ssl: false,
    });
    setTestResult(null);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const payload = {
        type: dbType,
        ...(connectionMode === "url"
          ? { connectionUrl: formData.connectionUrl }
          : {
              host: formData.host,
              port: parseInt(formData.port) || dbInfo.defaultPort,
              database: formData.database,
              username: formData.username,
              password: formData.password,
              ssl: formData.ssl,
            }),
      };

      const response = await fetch("/api/connections/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || "Connection successful!",
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || "Connection failed",
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Failed to test connection",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name || `${dbInfo.name} Connection`,
        type: dbType,
        ...(connectionMode === "url"
          ? { connectionUrl: formData.connectionUrl }
          : {
              host: formData.host,
              port: parseInt(formData.port) || dbInfo.defaultPort,
              database: formData.database,
              username: formData.username,
              password: formData.password,
              ssl: formData.ssl,
            }),
      };

      const response = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        onSuccess?.();
      } else {
        alert(data.message || "Failed to create connection");
      }
    } catch (error: any) {
      alert(error.message || "Failed to create connection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Database Type Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Database Type
        </label>
        <select
          value={dbType}
          onChange={(e) => handleDbTypeChange(e.target.value as DatabaseType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
        >
          {Object.entries(DATABASE_INFO).map(([type, info]) => (
            <option key={type} value={type}>
              {info.name} - {info.description}
            </option>
          ))}
        </select>
      </div>

      {/* Connection Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Connection Name
        </label>
        <input
          type="text"
          placeholder={`My ${dbInfo.name} Database`}
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Connection Mode Tabs (for non-SQLite) */}
      {!isSQLite && (
        <div className="space-y-4">
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setConnectionMode("url")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                connectionMode === "url"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Connection URL
            </button>
            <button
              type="button"
              onClick={() => setConnectionMode("fields")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                connectionMode === "fields"
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Individual Fields
            </button>
          </div>

          {connectionMode === "url" ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Connection URL
              </label>
              <input
                type="text"
                placeholder={dbInfo.placeholder.connectionUrl}
                value={formData.connectionUrl}
                onChange={(e) =>
                  handleInputChange("connectionUrl", e.target.value)
                }
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Example:{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                  {dbInfo.urlExample}
                </code>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Host
                  </label>
                  <input
                    type="text"
                    placeholder={dbInfo.placeholder.host}
                    value={formData.host}
                    onChange={(e) => handleInputChange("host", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Port
                  </label>
                  <input
                    type="number"
                    placeholder={dbInfo.placeholder.port}
                    value={formData.port}
                    onChange={(e) => handleInputChange("port", e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Database Name
                </label>
                <input
                  type="text"
                  placeholder={dbInfo.placeholder.database}
                  value={formData.database}
                  onChange={(e) =>
                    handleInputChange("database", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Username
                </label>
                <input
                  type="text"
                  placeholder={dbInfo.placeholder.username}
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={formData.ssl}
                  onChange={(e) => handleInputChange("ssl", e.target.checked)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="ssl"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Use SSL/TLS Connection
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SQLite specific fields */}
      {isSQLite && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Database File Path
          </label>
          <input
            type="text"
            placeholder={dbInfo.placeholder.database}
            value={formData.database}
            onChange={(e) => handleInputChange("database", e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Full path to your SQLite database file
          </p>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 ${
            testResult.success
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              testResult.success
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }`}
          >
            {testResult.message}
          </p>
        </div>
      )}

      {/* Helper Text */}
      {!isFormValid() && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {isSQLite
              ? "Please enter the database file path to continue"
              : connectionMode === "url"
              ? "Please enter the connection URL to continue"
              : "Please fill in all connection fields to continue"}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={testConnection}
          disabled={testing || loading || !isFormValid()}
          className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            "Test Connection"
          )}
        </button>

        <button
          type="submit"
          disabled={loading || testing || !isFormValid()}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Connection"
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
