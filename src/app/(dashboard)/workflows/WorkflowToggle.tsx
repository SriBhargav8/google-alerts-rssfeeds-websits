"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WorkflowToggle({ id, initialActive }: { id: string, initialActive: boolean }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newState = !isActive;
    setIsActive(newState); // Optimistic UI update

    try {
      const res = await fetch(`/api/workflows/${id}/toggle`, {
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
      alert("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}
