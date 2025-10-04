// app/(dashboard)/dashboards/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DataVisualization from "@/components/DataVisualization";
import { useUserStore } from "@/store/userStore";

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  chartCount: number;
  createdAt: string;
}

interface PinnedChart {
  id: string;
  title: string;
  chartType: string;
  vizConfig: any;
  cachedData: any[];
  lastRefreshedAt: string;
  question: string;
  sql: string;
}

export default function DashboardsPage() {
  const router = useRouter();
  const plan = useUserStore((state) => state.plan);
  const hasAccess = ["starter", "growth", "enterprise"].includes(plan);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(
    null
  );
  const [charts, setCharts] = useState<PinnedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAccess) {
      router.push("/billing");
    } else {
      fetchDashboards();
    }
  }, [hasAccess]);

  const fetchDashboards = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboards");
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);

        // Auto-select first dashboard
        if (data.dashboards.length > 0) {
          const defaultDash = data.dashboards.find(
            (d: Dashboard) => d.name === "My Dashboard"
          );
          setSelectedDashboard(defaultDash?.id || data.dashboards[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardCharts = async (dashboardId: string) => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`);
      if (response.ok) {
        const data = await response.json();
        setCharts(data.charts || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard charts:", error);
    }
  };

  useEffect(() => {
    if (selectedDashboard) {
      fetchDashboardCharts(selectedDashboard);
    }
  }, [selectedDashboard]);

  const createDashboard = async () => {
    const name = prompt("Enter dashboard name:");
    if (!name) return;

    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards([...dashboards, { ...data.dashboard, chartCount: 0 }]);
        setSelectedDashboard(data.dashboard.id);
      }
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      alert("Failed to create dashboard");
    }
  };

  const deleteDashboard = async (dashboardId: string) => {
    if (!confirm("Delete this dashboard and all its charts?")) return;

    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDashboards(dashboards.filter((d) => d.id !== dashboardId));
        if (selectedDashboard === dashboardId) {
          setSelectedDashboard(dashboards[0]?.id || null);
        }
      }
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
      alert("Failed to delete dashboard");
    }
  };

  const refreshChart = async (chartId: string) => {
    setRefreshing(chartId);
    try {
      const response = await fetch(
        `/api/dashboards/charts/${chartId}/refresh`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCharts(
          charts.map((c) =>
            c.id === chartId
              ? {
                  ...c,
                  cachedData: data.results,
                  lastRefreshedAt: new Date().toISOString(),
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to refresh chart:", error);
    } finally {
      setRefreshing(null);
    }
  };

  const deleteChart = async (chartId: string) => {
    if (!confirm("Remove this chart from dashboard?")) return;

    try {
      const response = await fetch(`/api/dashboards/charts/${chartId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCharts(charts.filter((c) => c.id !== chartId));
      }
    } catch (error) {
      console.error("Failed to delete chart:", error);
    }
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case "line":
        return <TrendingUp className="h-4 w-4" />;
      case "bar":
        return <BarChart3 className="h-4 w-4" />;
      case "pie":
        return <PieChartIcon className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className=" mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8" />
              Dashboards
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Pin and organize your most important charts
            </p>
          </div>
          <Button onClick={createDashboard}>
            <Plus className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
        </div>

        {/* Dashboard Tabs */}
        {dashboards.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {dashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => setSelectedDashboard(dashboard.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedDashboard === dashboard.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {dashboard.name}
                <span className="ml-2 text-xs opacity-75">
                  ({dashboard.chartCount})
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {dashboards.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <LayoutDashboard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Dashboards Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Create your first dashboard to start pinning charts
          </p>
          <Button onClick={createDashboard}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>
      )}

      {/* Dashboard Content */}
      {selectedDashboard && dashboards.length > 0 && (
        <div>
          {/* Dashboard Actions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {dashboards.find((d) => d.id === selectedDashboard)?.name}
              </h2>
              {dashboards.find((d) => d.id === selectedDashboard)
                ?.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                  {
                    dashboards.find((d) => d.id === selectedDashboard)
                      ?.description
                  }
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteDashboard(selectedDashboard)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Charts Grid */}
          {charts.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Charts Pinned Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Run queries in chat and pin charts to this dashboard
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Chart Header */}
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChartIcon(chart.chartType)}
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {chart.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refreshChart(chart.id)}
                        disabled={refreshing === chart.id}
                        title="Refresh data"
                      >
                        {refreshing === chart.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteChart(chart.id)}
                        title="Remove from dashboard"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Chart Content */}
                  <div className="p-4">
                    {chart.cachedData && chart.cachedData.length > 0 ? (
                      <DataVisualization data={chart.cachedData} />
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No data available
                      </div>
                    )}
                  </div>

                  {/* Chart Footer */}
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last updated:{" "}
                      {new Date(chart.lastRefreshedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      Query: {chart.question}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
