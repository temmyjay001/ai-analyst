// components/ChartActions.tsx - IMPROVED WITH TOAST & BETTER UX
"use client";

import React, { useState } from "react";
import { Download, Pin, Loader2, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useUserStore } from "@/store/userStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import * as htmlToImage from "html-to-image";

interface Dashboard {
  id: string;
  name: string;
}

interface ChartActionsProps {
  chartRef: React.RefObject<HTMLDivElement>;
  chartData: {
    title: string;
    question: string;
    sql: string;
    results: any[];
    vizConfig: any;
    connectionId: string;
    sessionId?: string;
    messageId?: string;
  };
}

export function ChartActions({
  chartRef,
  chartData,
}: Readonly<ChartActionsProps>) {
  const plan = useUserStore((state) => state.plan);
  const hasAccess = ["starter", "growth", "enterprise"].includes(plan);

  const [downloading, setDownloading] = useState(false);
  const [showPinDropdown, setShowPinDropdown] = useState(false);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState("");
  const [loadingDashboards, setLoadingDashboards] = useState(false);
  const [pinning, setPinning] = useState(false);

  // Dialog for creating new dashboard
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState("");

  // Download chart as image
  const downloadChart = async () => {
    if (!hasAccess) {
      toast.error("Download feature requires Starter plan or above", {
        description: "Upgrade your plan to download charts",
        action: {
          label: "Upgrade",
          onClick: () => (window.location.href = "/billing"),
        },
      });
      return;
    }

    if (!chartRef.current) {
      toast.error("Chart not ready for download");
      return;
    }

    setDownloading(true);
    const toastId = toast.loading("Preparing chart for download...");

    try {
      toast.loading("Rendering chart...", { id: toastId });

      const dataUrl = await htmlToImage.toPng(chartRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: {
          width: `${chartRef.current.offsetWidth}px`,
          height: `${chartRef.current.offsetHeight}px`,
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      const fileName = `${chartData.title.replace(
        /\s+/g,
        "_"
      )}_${Date.now()}.png`;
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Chart downloaded successfully", {
        id: toastId,
        description: fileName,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download chart", {
        id: toastId,
        description: "Please try again or contact support",
      });
    } finally {
      setDownloading(false);
    }
  };


  // Fetch dashboards
  const fetchDashboards = async () => {
    setLoadingDashboards(true);
    try {
      const response = await fetch("/api/dashboards");
      if (response.ok) {
        const data = await response.json();
        setDashboards(data.dashboards || []);

        // Auto-select default dashboard
        const defaultDash = data.dashboards.find(
          (d: Dashboard) => d.name === "My Dashboard"
        );
        if (defaultDash) {
          setSelectedDashboard(defaultDash.id);
        }
      } else {
        toast.error("Failed to load dashboards");
      }
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
      toast.error("Failed to load dashboards");
    } finally {
      setLoadingDashboards(false);
    }
  };

  // Create new dashboard
  const createDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast.error("Please enter a dashboard name");
      return;
    }

    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDashboardName }),
      });

      if (response.ok) {
        const data = await response.json();
        setDashboards([...dashboards, data.dashboard]);
        setSelectedDashboard(data.dashboard.id);
        setCreateDialogOpen(false);
        setNewDashboardName("");
        toast.success(`Dashboard "${newDashboardName}" created`);
      } else {
        toast.error("Failed to create dashboard");
      }
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      toast.error("Failed to create dashboard");
    }
  };

  // Pin chart to dashboard
  const pinChart = async () => {
    if (!selectedDashboard) {
      toast.error("Please select a dashboard");
      return;
    }

    setPinning(true);
    const toastId = toast.loading("Pinning chart to dashboard...");

    try {
      const response = await fetch("/api/dashboards/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardId: selectedDashboard,
          title: chartData.title,
          chartType: chartData.vizConfig.type,
          connectionId: chartData.connectionId,
          sessionId: chartData.sessionId,
          messageId: chartData.messageId,
          sql: chartData.sql,
          question: chartData.question,
          vizConfig: chartData.vizConfig,
          cachedData: chartData.results,
        }),
      });

      if (response.ok) {
        const dashboardName = dashboards.find(
          (d) => d.id === selectedDashboard
        )?.name;
        toast.success("Chart pinned successfully", {
          id: toastId,
          description: `Added to ${dashboardName}`,
          action: {
            label: "View",
            onClick: () => (window.location.href = "/dashboards"),
          },
        });

        setTimeout(() => {
          setShowPinDropdown(false);
        }, 1500);
      } else {
        const error = await response.json();
        toast.error("Failed to pin chart", {
          id: toastId,
          description: error.message || "Please try again",
        });
      }
    } catch (error) {
      console.error("Failed to pin chart:", error);
      toast.error("Failed to pin chart", { id: toastId });
    } finally {
      setPinning(false);
    }
  };

  // Handle pin button click
  const handlePinClick = () => {
    if (!hasAccess) {
      toast.error("Pin to Dashboard requires Starter plan or above", {
        description: "Upgrade your plan to pin charts",
        action: {
          label: "Upgrade",
          onClick: () => (window.location.href = "/billing"),
        },
      });
      return;
    }
    setShowPinDropdown(true);
    fetchDashboards();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Download Button */}
        <Button
          variant={hasAccess ? "outline" : "ghost"}
          size="sm"
          onClick={downloadChart}
          disabled={downloading}
          className="relative"
          title={hasAccess ? "Download chart as PNG" : "Upgrade to download"}
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {!hasAccess && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />
          )}
        </Button>

        {/* Pin to Dashboard */}
        {!showPinDropdown ? (
          <Button
            variant={hasAccess ? "outline" : "ghost"}
            size="sm"
            onClick={handlePinClick}
            className="relative"
            title={hasAccess ? "Pin to dashboard" : "Upgrade to pin charts"}
          >
            <Pin className="h-4 w-4" />
            {!hasAccess && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            <Select
              value={selectedDashboard}
              onValueChange={setSelectedDashboard}
            >
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Select dashboard" />
              </SelectTrigger>
              <SelectContent>
                {loadingDashboards ? (
                  <div className="p-2 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : dashboards.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No dashboards yet
                  </div>
                ) : (
                  dashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      {dashboard.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDialogOpen(true)}
              title="Create new dashboard"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              onClick={pinChart}
              disabled={pinning || !selectedDashboard}
              title="Pin chart"
            >
              {pinning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPinDropdown(false)}
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create Dashboard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Give your dashboard a name to start organizing charts
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="dashboard-name">Dashboard Name</Label>
            <Input
              id="dashboard-name"
              placeholder="e.g., Sales Analytics"
              value={newDashboardName}
              onChange={(e) => setNewDashboardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDashboardName.trim()) {
                  createDashboard();
                }
              }}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                setNewDashboardName("");
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
    </>
  );
}
