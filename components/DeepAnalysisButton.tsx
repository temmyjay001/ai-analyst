// components/DeepAnalysisButton.tsx

"use client";

import { Brain, Crown } from "lucide-react";
import { useUserStore } from "@/store/userStore";

interface DeepAnalysisButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function DeepAnalysisButton({
  onClick,
  disabled = false,
}: Readonly<DeepAnalysisButtonProps>) {
  const userPlan = useUserStore((state) => state.plan);
  const isPremium = userPlan === "growth" || userPlan === "enterprise";

  return (
    <div className="mt-3">
      <button
        onClick={onClick}
        disabled={disabled || !isPremium}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isPremium
            ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Brain className="h-4 w-4" />
        <span>Deep Analysis</span>
        {!isPremium && <Crown className="h-4 w-4" />}
      </button>
      {!isPremium && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Get 3 automatic follow-up analyses with Growth plan
        </p>
      )}
    </div>
  );
}
