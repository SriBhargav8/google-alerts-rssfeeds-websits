"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rss, Sparkles, Share2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleDemoLogin = async () => {
    setEmail("admin@example.com");
    setPassword("password123");
    await performLogin("admin@example.com", "password123");
  };

  const performLogin = async (loginEmail: string, loginPass: string) => {
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-600/30">
              <Rss size={32} className="text-white absolute bottom-3 left-3" />
              <Sparkles size={20} className="text-emerald-300 absolute top-3 right-3" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <Share2 size={14} className="text-slate-700" />
            </div>
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          AutoFeed
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500 max-w-xs mx-auto">
          The autonomous orchestration engine that turns raw feeds into published masterpieces.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 text-center font-medium">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Administrator Email
              </label>
              <div className="mt-1">
                <input
                  type="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <div className="mt-1">
                <input
                  type="password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm font-mono transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit" disabled={loading}
                className="w-full flex justify-center items-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all"
              >
                <span>{loading ? "Authenticating..." : "Access Dashboard"}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>
          </form>

          {/* Development Auto-Login Box */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-center">
              <p className="text-xs text-indigo-800 font-medium mb-3">Development Mode Fast Access</p>
              <button 
                type="button" 
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center space-x-2"
              >
                <span>Login to the platform</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400 font-medium">Internal Use Only. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
