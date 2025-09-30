"use client";

import { useState, useEffect } from "react";
import {
  Database,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

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
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Database Connections
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your database connections
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

        {connections.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No connections yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get started by connecting your first database
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Connection
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <Database className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {connection.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {connection.type} • {connection.database}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {connection.host}:{connection.port}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {connection.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {connection.lastTestedAt
                          ? `Tested ${new Date(
                              connection.lastTestedAt
                            ).toLocaleDateString()}`
                          : "Not tested"}
                      </span>
                    </div>
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
    </div>
  );
}
