// components/ChartActions.tsx
"use client";

import React, { useState, useRef } from "react";
import { Download, Pin, Loader2, Check, Plus, X } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  const [pinned, setPinned] = useState(false);

  // Download chart as image
  const downloadChart = async () => {
    if (!hasAccess) {
      alert(
        "Download feature is available for Starter plan and above. Upgrade to access!"
      );
      return;
    }

    if (!chartRef.current) return;

    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;

      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const fileName = `${chartData.title.replace(
          /\s+/g,
          "_"
        )}_${Date.now()}.png`;

        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download chart");
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
      }
    } catch (error) {
      console.error("Failed to fetch dashboards:", error);
    } finally {
      setLoadingDashboards(false);
    }
  };

  // Create new dashboard
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
        setDashboards([...dashboards, data.dashboard]);
        setSelectedDashboard(data.dashboard.id);
      }
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      alert("Failed to create dashboard");
    }
  };

  // Pin chart to dashboard
  const pinChart = async () => {
    if (!selectedDashboard) {
      alert("Please select a dashboard");
      return;
    }

    setPinning(true);
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
        setPinned(true);
        setTimeout(() => {
          setPinned(false);
          setShowPinDropdown(false);
        }, 2000);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to pin chart");
      }
    } catch (error) {
      console.error("Failed to pin chart:", error);
      alert("Failed to pin chart");
    } finally {
      setPinning(false);
    }
  };

  // Handle pin button click
  const handlePinClick = () => {
    if (!hasAccess) {
      alert(
        "Pin to Dashboard is available for Starter plan and above. Upgrade to access!"
      );
      return;
    }
    setShowPinDropdown(true);
    fetchDashboards();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Download Button */}
      <Button
        variant={hasAccess ? "outline" : "ghost"}
        size="sm"
        onClick={downloadChart}
        disabled={downloading}
        className="relative cursor-pointer"
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
                <div className="p-2 text-sm text-gray-500">No dashboards</div>
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
            onClick={createDashboard}
            title="Create new dashboard"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={pinChart}
            disabled={pinning || !selectedDashboard}
          >
            {pinning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : pinned ? (
              <>
                <Check className="h-4 w-4" />
                <span className="ml-1">Pinned!</span>
              </>
            ) : (
              <>
                <Pin className="h-4 w-4" />
                <span className="ml-1">Pin</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPinDropdown(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
