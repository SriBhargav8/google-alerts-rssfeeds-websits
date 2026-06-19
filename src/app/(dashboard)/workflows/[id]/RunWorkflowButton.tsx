"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RunWorkflowButton({ workflowId, variant = "primary" }: { workflowId: string, variant?: "primary" | "secondary" }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRun = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        if (data.runId) {
          router.push(`/workflows/${workflowId}/runs/${data.runId}`);
        } else {
          router.refresh();
        }
      } else {
        alert("Failed to start workflow run.");
      }
    } catch (err) {
      alert("Error starting workflow run.");
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = "flex items-center space-x-2 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-5 py-2.5",
    secondary: "bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-4 py-2 border border-slate-200 ml-1 disabled:bg-slate-100 disabled:text-slate-400"
  };

  return (
    <button 
      onClick={handleRun}
      disabled={loading}
      className={`${baseClasses} ${variants[variant]}`}
    >
      <Play size={16} />
      <span>{loading ? "..." : "Run"}</span>
    </button>
  );
}
