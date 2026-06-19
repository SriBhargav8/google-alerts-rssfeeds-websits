"use client";

import { useEffect, useState, useRef } from "react";
import { Search, Command, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SpotlightSearch({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-0">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <Search size={22} className="text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                setIsOpen(false);
                router.push(`/workflows?q=${encodeURIComponent(query)}`);
              }
            }}
            placeholder="Search workflows, tools, settings..."
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-900 text-lg placeholder-slate-400"
          />
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto">
          {query.trim() === "" ? (
            <div className="p-12 text-center text-slate-500">
              <Command size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm font-medium">Type anything to start searching</p>
            </div>
          ) : (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Workflow Results</div>
              {isSearching ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 mx-auto border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : results.length > 0 ? (
                <>
                  {results.map((wf) => (
                    <Link
                      key={wf.id}
                      href={`/workflows/${wf.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 rounded-xl group transition-colors"
                    >
                      <div className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-3 ${wf.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span className="text-sm font-bold text-slate-700">{wf.name}</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </Link>
                  ))}
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <Link 
                      href={`/workflows?q=${encodeURIComponent(query)}`}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 text-center rounded-xl transition-colors"
                    >
                      View all results
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-sm text-slate-500 font-medium">
                  No matches found for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 mr-1.5 shadow-sm font-mono text-[10px]">Enter</kbd> to select</span>
            <span className="flex items-center"><kbd className="bg-white border border-slate-200 rounded px-1.5 py-0.5 mr-1.5 shadow-sm font-mono text-[10px]">Esc</kbd> to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
