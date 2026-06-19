"use client";

import { useState, useEffect } from "react";

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

export default function CronBuilder({ value, onChange }: CronBuilderProps) {
  // Parse initial value
  const parts = value.split(" ");
  const m = parts[0] || "0";
  const h = parts[1] || "8";
  const d = parts[4] || "*";

  let initialType = "daily";
  let initialTime = "08:00";
  let initialInterval = "6";
  let initialDays: string[] = ["1"];

  if (value === "manual") {
    initialType = "manual";
  } else if (h.includes("*/")) {
    initialType = "interval";
    initialInterval = h.replace("*/", "");
  } else if (d !== "*") {
    initialType = "weekly";
    initialTime = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    initialDays = d.split(",");
  } else {
    initialType = "daily";
    initialTime = `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }

  const [type, setType] = useState(initialType);
  const [intervalHour, setIntervalHour] = useState(initialInterval);
  const [time, setTime] = useState(initialTime);
  const [days, setDays] = useState<string[]>(initialDays);

  useEffect(() => {
    if (type === "manual") {
      onChange("manual");
      return;
    }

    let newCron = "0 8 * * *";
    
    if (type === "interval") {
      newCron = `0 */${intervalHour} * * *`;
    } else if (type === "daily") {
      const [hour, minute] = time.split(":");
      newCron = `${parseInt(minute)} ${parseInt(hour)} * * *`;
    } else if (type === "weekly") {
      const [hour, minute] = time.split(":");
      const dayStr = days.length > 0 ? days.join(",") : "*";
      newCron = `${parseInt(minute)} ${parseInt(hour)} * * ${dayStr}`;
    }

    onChange(newCron);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, intervalHour, time, days]);

  const toggleDay = (day: string) => {
    if (days.includes(day)) {
      setDays(days.filter(d => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const dayOptions = [
    { label: "Mon", value: "1" },
    { label: "Tue", value: "2" },
    { label: "Wed", value: "3" },
    { label: "Thu", value: "4" },
    { label: "Fri", value: "5" },
    { label: "Sat", value: "6" },
    { label: "Sun", value: "0" },
  ];

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setType("manual")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === "manual" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Manual</button>
        <button type="button" onClick={() => setType("interval")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === "interval" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Interval</button>
        <button type="button" onClick={() => setType("daily")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === "daily" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Daily</button>
        <button type="button" onClick={() => setType("weekly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === "weekly" ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>Weekly</button>
      </div>

      <div className="pt-2">
        {type === "manual" && (
          <div className="flex items-start space-x-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-amber-500 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              This workflow will <strong>not run automatically</strong>. Use the <strong>Run Now</strong> button on the workflow detail page to trigger it manually.
            </p>
          </div>
        )}

        {type === "interval" && (
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-700">Run every</span>
            <select value={intervalHour} onChange={e => setIntervalHour(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
              <option value="1">1 Hour</option>
              <option value="2">2 Hours</option>
              <option value="4">4 Hours</option>
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
            </select>
          </div>
        )}

        {type === "daily" && (
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-700">Run daily at</span>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
        )}

        {type === "weekly" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {dayOptions.map(day => (
                <button 
                  key={day.value} type="button" onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${days.includes(day.value) ? "bg-indigo-100 text-indigo-700 border border-indigo-300" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-100"}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700">at</span>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        )}
      </div>
      

    </div>
  );
}
