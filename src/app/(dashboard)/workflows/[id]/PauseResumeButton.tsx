"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause } from "lucide-react";

interface PauseResumeButtonProps {
  workflowId: string;
  initialActive: boolean;
}

export default function PauseResumeButton({ workflowId, initialActive }: PauseResumeButtonProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newState = !isActive;
    setIsActive(newState); // Optimistic UI update

    try {
      const res = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newState }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        // Revert on failure
        setIsActive(!newState);
        alert("Failed to toggle workflow state");
      }
    } catch (e) {
      setIsActive(!newState);
      alert("Error occurred while toggling");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggle}
      disabled={loading}
      className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-bold transition-all shadow-sm ${
        isActive 
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" 
          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      }`}
    >
      {isActive ? (
        <>
          <Pause size={16} />
          <span>Pause</span>
        </>
      ) : (
        <>
          <Play size={16} />
          <span>Resume</span>
        </>
      )}
    </button>
  );
}
