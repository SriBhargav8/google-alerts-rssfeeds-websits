"use client";

import { useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface CostBlockWarningProps {
  spent: number;
  limit: number;
  blocked: boolean;
  override: boolean;
}

export default function CostBlockWarning({ spent, limit, blocked, override }: CostBlockWarningProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!blocked) return null;

  const handleResetSpend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_spent_usd: "0.000000",
          ai_blocked: "false",
          ai_override: "false"
        }),
      });
      if (res.ok) {
        alert("API spent limits reset successfully!");
        router.refresh();
      } else {
        alert("Failed to reset spend limits");
      }
    } catch (e) {
      alert("Error resetting spend limit");
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_override: "true"
        }),
      });
      if (res.ok) {
        alert("API block overridden! Workflows will now run.");
        router.refresh();
      } else {
        alert("Failed to override block");
      }
    } catch (e) {
      alert("Error overriding block");
    } finally {
      setLoading(false);
    }
  };

  if (!override) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm dark:bg-amber-950/20 dark:border-amber-900/30">
        <div className="flex items-start space-x-3">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">AI Executions Blocked (Soft Block)</h3>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              You have spent <strong>${spent.toFixed(2)} USD</strong> on AI APIs, which exceeds your set soft-limit of <strong>${limit.toFixed(2)} USD</strong>. Workflows are currently paused.
            </p>
          </div>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOverrideBlock}
            disabled={loading}
            className="flex-1 sm:flex-none px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            {loading ? "Processing..." : "Override Block"}
          </button>
          <button
            type="button"
            onClick={handleResetSpend}
            disabled={loading}
            className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 disabled:bg-slate-300 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          >
            Reset Spend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm dark:bg-blue-950/20 dark:border-blue-900/30">
      <div className="flex items-start space-x-3">
        <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Cost Limit Exceeded (Overridden)</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            API spend (<strong>${spent.toFixed(2)} USD</strong>) is currently above limit (<strong>${limit.toFixed(2)} USD</strong>), but the block is overridden. Workflows will run.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleResetSpend}
        disabled={loading}
        className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
      >
        {loading ? "Processing..." : "Reset Spend Counter"}
      </button>
    </div>
  );
}
