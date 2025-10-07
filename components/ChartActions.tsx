// components/ChartActions.tsx - UPDATED WITH PROPER NAVIGATION
"use client";

import React, { useState } from "react";
import { Download, Pin, Loader2, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
          onClick: () => router.push("/billing"),
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
  const createNewDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast.error("Please enter a dashboard name");
      return;
    }

    try {
      const response = await fetch("/api/dashboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDashboardName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Dashboard created successfully");
        setDashboards((prev) => [...prev, data.dashboard]);
        setSelectedDashboard(data.dashboard.id);
        setNewDashboardName("");
        setCreateDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error("Failed to create dashboard", {
          description: error.message || "Please try again",
        });
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
          connectionId: chartData.connectionId,
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
            onClick: () => router.push("/dashboards"),
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
          onClick: () => router.push("/billing"),
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
            title={
              hasAccess ? "Pin to dashboard" : "Upgrade to pin to dashboard"
            }
          >
            <Pin className="h-4 w-4" />
            {!hasAccess && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
            {loadingDashboards ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : (
              <>
                <Select
                  value={selectedDashboard}
                  onValueChange={setSelectedDashboard}
                >
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Select dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        {dashboard.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setCreateDialogOpen(true)}
                  title="Create new dashboard"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={pinChart}
                  disabled={!selectedDashboard || pinning}
                >
                  {pinning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPinDropdown(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Dashboard Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Create a new dashboard to organize your charts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                placeholder="My Dashboard"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createNewDashboard();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={createNewDashboard}>Create Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
