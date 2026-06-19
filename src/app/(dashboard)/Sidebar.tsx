"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Settings, Key, LogOut, Sparkles, Network, FileText, HelpCircle, Plus, ChevronLeft, ChevronRight, X, Sun, Moon, Laptop } from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  desktopCollapsed: boolean;
  setDesktopCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen, desktopCollapsed, setDesktopCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const applyTheme = (pref: "light" | "dark" | "system") => {
    let isDark = false;
    if (pref === "dark") {
      isDark = true;
    } else if (pref === "light") {
      isDark = false;
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const pref = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
    setTheme(pref);
    applyTheme(pref);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const currentPref = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
      if (currentPref === "system") {
        applyTheme("system");
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const cycleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    handleThemeChange(nextTheme);
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Workflows", href: "/workflows", icon: Network },
    { name: "Integrations", href: "/integrations", icon: Key },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Logs", href: "/logs", icon: FileText },
  ];

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-40 bg-[#1E1F22] text-slate-300 flex flex-col transition-all duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        ${desktopCollapsed ? "lg:w-20" : "lg:w-64"}
        w-64
      `}
    >
      {/* Header / Logo */}
      <div className={`p-4 flex items-center border-b border-white/5 ${desktopCollapsed ? 'justify-center' : 'justify-between lg:px-6'} h-16`}>
        <div 
          onClick={desktopCollapsed ? () => setDesktopCollapsed(false) : undefined}
          className={`flex items-center space-x-3 overflow-hidden ${desktopCollapsed ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          title={desktopCollapsed ? "Expand Sidebar" : undefined}
        >
          <div className="w-8 h-8 flex-shrink-0 shadow-md rounded-lg overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect width="100" height="100" rx="20" fill="#4F46E5"/>
              <path d="M25 70A10 10 0 1 1 25 50A10 10 0 0 1 25 70ZM25 40A30 30 0 0 1 55 70" stroke="white" strokeWidth="8" strokeLinecap="round" fill="none"/>
              <path d="M25 20A50 50 0 0 1 75 70" stroke="white" strokeWidth="8" strokeLinecap="round" fill="none"/>
              <circle cx="75" cy="25" r="12" fill="#10B981" />
              <path d="M75 17L77 23L83 25L77 27L75 33L73 27L67 25L73 23Z" fill="white" />
            </svg>
          </div>
          <div className={`transition-opacity duration-200 ${desktopCollapsed ? 'opacity-0 w-0 hidden lg:block' : 'opacity-100'}`}>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              AutoFeed
            </h1>
          </div>
        </div>
        
        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className={`hidden ${desktopCollapsed ? 'hidden' : 'lg:flex'} w-7 h-7 bg-white/5 hover:bg-white/10 rounded-md items-center justify-center text-slate-400 hover:text-white transition-colors`}
        >
          {desktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* New Workflow Button */}
      <div className={`p-4 ${desktopCollapsed ? 'flex justify-center' : ''}`}>
        <Link 
          href="/workflows/new" 
          onClick={() => setMobileOpen(false)}
          className={`flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg font-bold transition-all shadow-sm ${desktopCollapsed ? 'w-10 h-10 px-0' : 'w-full px-4'}`}
          title={desktopCollapsed ? "New Workflow" : undefined}
        >
          <Plus size={18} />
          {!desktopCollapsed && <span>New Workflow</span>}
        </Link>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/logs");
          return (
            <Link 
              key={item.name} 
              href={item.href} 
              onClick={() => setMobileOpen(false)}
              title={desktopCollapsed ? item.name : undefined}
              className={`flex items-center space-x-4 py-3 transition-all duration-200 ${desktopCollapsed ? 'px-0 justify-center' : 'px-6'} ${
                isActive 
                  ? "bg-[#2B2D31] text-white border-l-4 border-indigo-500 font-semibold" 
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-4 border-transparent font-medium"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-indigo-400 flex-shrink-0" : "text-slate-400 flex-shrink-0"} />
              {!desktopCollapsed && <span className="text-sm whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <div className="border-t border-white/5 py-4 space-y-1">
        {/* Theme Toggle Switcher */}
        {desktopCollapsed ? (
          <button 
            type="button"
            onClick={cycleTheme}
            className="flex items-center justify-center py-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 font-medium transition-all w-full px-0"
            title={`Theme: ${theme.toUpperCase()} (Click to cycle)`}
          >
            {theme === "light" && <Sun size={20} className="text-amber-400" />}
            {theme === "dark" && <Moon size={20} className="text-indigo-400" />}
            {theme === "system" && <Laptop size={20} className="text-blue-400" />}
          </button>
        ) : (
          <div className="px-6 py-2">
            <div className="flex bg-[#121315] border border-white/5 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${
                  theme === "light" ? "bg-[#2B2D31] text-amber-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Light Mode"
              >
                <Sun size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${
                  theme === "dark" ? "bg-[#2B2D31] text-indigo-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Dark Mode"
              >
                <Moon size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("system")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-md transition-all ${
                  theme === "system" ? "bg-[#2B2D31] text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-200"
                }`}
                title="System Mode"
              >
                <Laptop size={14} />
              </button>
            </div>
          </div>
        )}

        <Link 
          href="/help"
          className={`flex items-center space-x-4 py-3 text-slate-400 hover:bg-white/5 hover:text-slate-200 font-medium transition-all w-full text-left ${desktopCollapsed ? 'px-0 justify-center' : 'px-6'}`}
          title={desktopCollapsed ? "Help" : undefined}
        >
          <HelpCircle size={20} className="flex-shrink-0" />
          {!desktopCollapsed && <span className="text-sm whitespace-nowrap">Help</span>}
        </Link>
        <a 
          href="/api/auth/logout" 
          className={`flex items-center space-x-4 py-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 font-medium transition-all w-full text-left ${desktopCollapsed ? 'px-0 justify-center' : 'px-6'}`}
          title={desktopCollapsed ? "Sign Out" : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!desktopCollapsed && <span className="text-sm whitespace-nowrap">Sign Out</span>}
        </a>
      </div>

    </aside>
  );
}
