// app/(dashboard)/dashboards/page.tsx - EMERALD THEME
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
  Edit2,
  MoreVertical,
  Grid3x3,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DataVisualization from "@/components/DataVisualization";
import { useUserStore } from "@/store/userStore";

interface Dashboard {
  id: string;
  name: string;
  description: string | null;
  chartCount: number;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDesc, setNewDashboardDesc] = useState("");

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

        if (data.dashboards.length > 0) {
          const defaultDash = data.dashboards.find(
            (d: Dashboard) => d.name === "My Dashboard"
          );
          setSelectedDashboard(defaultDash?.id || data.dashboards[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
      toast.error("Failed to load dashboards");
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
    if (!newDashboardName.trim()) {
      toast.error("Please enter a dashboard name");
      return;
    }

    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDashboardName,
          description: newDashboardDesc || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards([...dashboards, { ...data.dashboard, chartCount: 0 }]);
        setSelectedDashboard(data.dashboard.id);
        setCreateDialogOpen(false);
        setNewDashboardName("");
        setNewDashboardDesc("");
        toast.success("Dashboard created successfully");
      } else {
        toast.error("Failed to create dashboard");
      }
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      toast.error("Failed to create dashboard");
    }
  };

  const deleteDashboard = async (dashboardId: string) => {
    try {
      const response = await fetch(`/api/dashboards/${dashboardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDashboards(dashboards.filter((d) => d.id !== dashboardId));
        if (selectedDashboard === dashboardId) {
          setSelectedDashboard(dashboards[0]?.id || null);
        }
        toast.success("Dashboard deleted successfully");
      } else {
        toast.error("Failed to delete dashboard");
      }
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
      toast.error("Failed to delete dashboard");
    }
  };

  const refreshChart = async (chartId: string) => {
    setRefreshing(chartId);
    try {
      const response = await fetch(
        `/api/dashboards/charts/${chartId}/refresh`,
        { method: "POST" }
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
        toast.success("Chart refreshed successfully");
      } else {
        toast.error("Failed to refresh chart");
      }
    } catch (error) {
      console.error("Failed to refresh chart:", error);
      toast.error("Failed to refresh chart");
    } finally {
      setRefreshing(null);
    }
  };

  const deleteChart = async (chartId: string) => {
    try {
      const response = await fetch(`/api/dashboards/charts/${chartId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCharts(charts.filter((c) => c.id !== chartId));
        setDashboards(
          dashboards.map((d) =>
            d.id === selectedDashboard
              ? { ...d, chartCount: d.chartCount - 1 }
              : d
          )
        );
        toast.success("Chart removed from dashboard");
      } else {
        toast.error("Failed to remove chart");
      }
    } catch (error) {
      console.error("Failed to delete chart:", error);
      toast.error("Failed to remove chart");
    }
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case "line":
        return <TrendingUp className="h-4 w-4 text-emerald-600" />;
      case "bar":
        return <BarChart3 className="h-4 w-4 text-emerald-600" />;
      case "pie":
        return <PieChartIcon className="h-4 w-4 text-emerald-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboards...
          </p>
        </div>
      </div>
    );
  }

  const selectedDashboardData = dashboards.find(
    (d) => d.id === selectedDashboard
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <LayoutDashboard className="h-10 w-10 text-emerald-600" />
              Dashboards
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Pin and organize your most important charts
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            New Dashboard
          </Button>
        </div>

        {/* Dashboard Tabs */}
        {dashboards.length > 0 && (
          <Tabs
            value={selectedDashboard || ""}
            onValueChange={setSelectedDashboard}
          >
            <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap gap-2 bg-transparent p-0">
              {dashboards.map((dashboard) => (
                <TabsTrigger
                  key={dashboard.id}
                  value={dashboard.id}
                  className="px-6 py-3 rounded-lg border"
                >
                  <span className="font-medium">{dashboard.name}</span>
                  <Badge variant="secondary" className="ml-2">
                    {dashboard.chartCount}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Empty State - No Dashboards */}
      {dashboards.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-6 rounded-full">
                <LayoutDashboard className="h-16 w-16 text-emerald-600" />
              </div>
            </div>
            <CardTitle className="text-2xl mb-2">No Dashboards Yet</CardTitle>
            <CardDescription className="text-base">
              Create your first dashboard to start pinning charts from your
              queries
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center pb-16">
            <Button onClick={() => setCreateDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Dashboard
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Dashboard Content */}
      {selectedDashboard && dashboards.length > 0 && (
        <div>
          {/* Dashboard Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedDashboardData?.name}
              </h2>
              {selectedDashboardData?.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedDashboardData.description}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Last updated:{" "}
                {new Date(
                  selectedDashboardData?.updatedAt || ""
                ).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Dashboard Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() =>
                      toast.info("Edit dashboard feature coming soon")
                    }
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (
                        confirm(
                          `Delete "${selectedDashboardData?.name}"? This will remove all pinned charts.`
                        )
                      ) {
                        deleteDashboard(selectedDashboard);
                      }
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Dashboard
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Empty State - No Charts */}
          {charts.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardHeader className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full">
                    <BarChart3 className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <CardTitle className="text-xl mb-2">
                  No Charts Pinned Yet
                </CardTitle>
                <CardDescription className="text-base">
                  Run queries in the chat interface and pin charts to this
                  dashboard
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center pb-16">
                <Button onClick={() => router.push("/chat")} variant="outline">
                  Go to Chat
                </Button>
              </CardFooter>
            </Card>
          ) : (
            /* Charts Grid/List */
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 lg:grid-cols-2 gap-6"
                  : "space-y-6"
              }
            >
              {charts.map((chart) => (
                <Card
                  key={chart.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Chart Header */}
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
                          {getChartIcon(chart.chartType)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {chart.title}
                          </CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                            {chart.chartType} Chart
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refreshChart(chart.id)}
                          disabled={refreshing === chart.id}
                          title="Refresh chart data"
                        >
                          {refreshing === chart.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                          ) : (
                            <RefreshCw className="h-4 w-4 text-gray-600 hover:text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(`Remove "${chart.title}" from dashboard?`)
                            ) {
                              deleteChart(chart.id);
                            }
                          }}
                          title="Remove from dashboard"
                        >
                          <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Chart Content */}
                  <CardContent className="p-6">
                    {chart.cachedData && chart.cachedData.length > 0 ? (
                      <DataVisualization data={chart.cachedData} />
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full inline-block mb-3">
                          <BarChart3 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">
                          No data available
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshChart(chart.id)}
                          className="mt-3"
                        >
                          <RefreshCw className="h-3 w-3 mr-2" />
                          Try Refreshing
                        </Button>
                      </div>
                    )}
                  </CardContent>

                  {/* Chart Footer */}
                  <CardFooter className="bg-gray-50 dark:bg-gray-900 border-t flex-col items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-medium">Last updated:</span>
                      <span className="text-gray-500">
                        {new Date(chart.lastRefreshedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 w-full">
                      <span className="font-medium whitespace-nowrap">
                        Query:
                      </span>
                      <span className="text-gray-500 line-clamp-2">
                        {chart.question}
                      </span>
                    </div>
                    {chart.sql && (
                      <details className="w-full mt-2">
                        <summary className="cursor-pointer text-emerald-600 hover:text-emerald-700 font-medium">
                          View SQL
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
                          {chart.sql}
                        </pre>
                      </details>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Dashboard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Give your dashboard a name and optional description to organize
              your charts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Dashboard Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sales Analytics, User Metrics"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newDashboardName.trim()) {
                    createDashboard();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="What will you track on this dashboard?"
                value={newDashboardDesc}
                onChange={(e) => setNewDashboardDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewDashboardName("");
                setNewDashboardDesc("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={createDashboard}
              disabled={!newDashboardName.trim()}
            >
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
