"use client";

import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen}
        desktopCollapsed={desktopCollapsed}
        setDesktopCollapsed={setDesktopCollapsed}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <TopNav setMobileOpen={setMobileOpen} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 lg:p-10">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
