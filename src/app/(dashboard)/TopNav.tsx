"use client";

import { Search, Bell, HelpCircle, User, Menu, CheckCircle2, AlertTriangle, AlertCircle, Info, Trash2, Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import SpotlightSearch from "./SpotlightSearch";

interface TopNavProps {
  setMobileOpen: (open: boolean) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  workflowId: string | null;
  runId: string | null;
  createdAt: string;
}

export default function TopNav({ setMobileOpen }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      const res = await fetch("/api/notifications?all=true", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      await handleMarkAsRead(n.id);
    }
    setShowNotifications(false);
    if (n.workflowId && n.runId) {
      router.push(`/workflows/${n.workflowId}/runs/${n.runId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "SUCCESS":
        return <CheckCircle2 size={14} className="text-emerald-600" />;
      case "ERROR":
        return <AlertTriangle size={14} className="text-rose-600" />;
      case "WARNING":
        return <AlertCircle size={14} className="text-amber-600" />;
      default:
        return <Info size={14} className="text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "SUCCESS":
        return "bg-emerald-50 border-emerald-100";
      case "ERROR":
        return "bg-rose-50 border-rose-100";
      case "WARNING":
        return "bg-amber-50 border-amber-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  function formatRelativeTime(dateStr: string) {
    try {
      const now = new Date();
      const created = new Date(dateStr);
      const diffMs = now.getTime() - created.getTime();
      if (diffMs < 0) return "just now";
      
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return "just now";
      
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return "";
    }
  }
  
  // Create breadcrumbs from pathname
  const segments = pathname.split("/").filter(Boolean);
  const currentSection = segments.length > 0 
    ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) 
    : "Dashboard";

  // Create breadcrumbs from pathname

  return (
    <>
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center text-sm font-medium text-slate-500 space-x-2">
          <span className="hidden sm:inline">AutoFeed</span>
          <span className="hidden sm:inline">›</span>
          <span className="text-slate-900 font-bold">{currentSection}</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 lg:space-x-6">
        <div className="relative hidden md:block z-50">
          <button 
            onClick={() => setIsSpotlightOpen(true)}
            className="flex items-center w-48 lg:w-64 pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors group"
          >
            <Search size={16} className="mr-2 text-slate-400 group-hover:text-slate-500 transition-colors" />
            <span>Search...</span>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-0.5 pointer-events-none">
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-sm group-hover:bg-slate-50">⌘</kbd>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded shadow-sm group-hover:bg-slate-50">K</kbd>
            </div>
          </button>
        </div>
        
        <div className="flex items-center space-x-3 lg:space-x-4 text-slate-500">
          <button 
            className="md:hidden hover:text-slate-900 dark:hover:text-white transition-colors p-1"
            onClick={() => setIsSpotlightOpen(true)}
          >
            <Search size={18} />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              className="relative hover:text-slate-900 dark:hover:text-white transition-colors p-1"
              onClick={() => {
                setShowNotifications(!showNotifications);
              }}
            >
              <Bell size={18} className="lg:w-5 lg:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-rose-500 border border-white rounded-full animate-pulse"></span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead} 
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5"
                        title="Mark all as read"
                      >
                        <Check size={12} className="mr-0.5" />
                        <span>Read all</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleClearAll} 
                        className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center space-x-0.5"
                        title="Clear all"
                      >
                        <Trash2 size={12} className="mr-0.5" />
                        <span>Clear</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 ml-1"
                    >
                      Close
                    </button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors duration-150 cursor-pointer relative flex items-start space-x-3 group ${
                          !n.read ? "bg-indigo-50/30 font-medium" : ""
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border ${getBgColor(n.type)} flex-shrink-0 mt-0.5`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <p className={`text-xs text-slate-900 leading-snug ${!n.read ? "font-bold" : "font-semibold"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteNotification(e, n.id)}
                          className="absolute right-3 top-3 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100"
                          title="Delete notification"
                        >
                          <Trash2 size={12} />
                        </button>
                        {!n.read && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full group-hover:hidden"></span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                      <Bell size={24} className="text-slate-300 mb-2 animate-pulse" />
                      <p className="text-sm font-medium text-slate-600">No notifications yet</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                        Notifications from workflow runs will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Link href="/help" className="hidden sm:block hover:text-slate-900 dark:hover:text-white transition-colors p-1">
            <HelpCircle size={18} className="lg:w-5 lg:h-5" />
          </Link>
          
          <div className="relative group ml-1">
            <Link 
              href="/profile"
              className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white border-2 border-white shadow-sm group-hover:ring-2 ring-indigo-500 transition-all"
            >
              <User size={16} />
            </Link>
            
            {/* Hover Dropdown */}
            <div className="absolute right-0 mt-0 w-48 pt-2 hidden group-hover:block z-50">
              <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1">
                <Link href="/profile" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 font-medium transition-colors">
                  My Profile
                </Link>
                <div className="h-px bg-slate-100 my-1"></div>
                <a href="/api/auth/logout" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors">
                  Sign Out
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    <SpotlightSearch isOpen={isSpotlightOpen} setIsOpen={setIsSpotlightOpen} />
    </>
  );
}
