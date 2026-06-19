"use client";

import { useState } from "react";
import { Save, Bot, Plus, Trash2, Eye, EyeOff, Edit2, Info, Lock, AlertTriangle, Activity, X } from "lucide-react";
import { useRouter } from "next/navigation";
import CostBlockWarning from "@/components/CostBlockWarning";

export type AiProviderConfig = {
  id: string;
  type: string;
  modelName: string;
  apiKey: string;
  isDefault: boolean;
};

export default function SettingsForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  let initialProviders: AiProviderConfig[] = [];
  try {
    if (initialSettings["ai_providers"]) {
      initialProviders = JSON.parse(initialSettings["ai_providers"]);
    }
  } catch (e) {}

  if (initialProviders.length === 0) {
    // Start empty
  }

  const [providers, setProviders] = useState<AiProviderConfig[]>(initialProviders);
  const [dailyTokenQuota, setDailyTokenQuota] = useState(initialSettings["daily_token_quota"] || "1000000");
  const [maxConcurrentExecutions, setMaxConcurrentExecutions] = useState(initialSettings["max_concurrent"] || "25");
  const [errorWebhooks, setErrorWebhooks] = useState(initialSettings["error_webhooks"] !== undefined ? initialSettings["error_webhooks"] === "true" : true);
  const [strictLogging, setStrictLogging] = useState(initialSettings["strict_logging"] === "true");

  const [aiCostLimit, setAiCostLimit] = useState(initialSettings["ai_cost_limit"] || "10.0");
  const [spent, setSpent] = useState(parseFloat(initialSettings["ai_spent_usd"] || "0"));
  const [blocked, setBlocked] = useState(initialSettings["ai_blocked"] === "true");
  const [overridden, setOverridden] = useState(initialSettings["ai_override"] === "true");

  const [providerToDelete, setProviderToDelete] = useState<number | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (providerId: string) => {
    setVisibleKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const requestDeleteProvider = (index: number) => {
    setProviderToDelete(index);
    setDeleteConfirmText("");
  };

  const confirmDeleteProvider = () => {
    if (providerToDelete !== null) {
      removeProvider(providerToDelete);
      setProviderToDelete(null);
      setDeleteConfirmText("");
    }
  };

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
        setSpent(0);
        setBlocked(false);
        setOverridden(false);
        alert("API spent limits reset successfully!");
        router.refresh();
      }
    } catch (e) {
      alert("Error resetting spend limit");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (index: number, field: keyof AiProviderConfig, value: any) => {
    const newProviders = [...providers];
    newProviders[index] = { ...newProviders[index], [field]: value };
    setProviders(newProviders);
  };

  const setAsDefault = (index: number) => {
    const newProviders = providers.map((p, i) => ({ ...p, isDefault: i === index }));
    setProviders(newProviders);
  };

  const removeProvider = (index: number) => {
    const newProviders = providers.filter((_, i) => i !== index);
    if (newProviders.length > 0 && providers[index].isDefault) {
      newProviders[0].isDefault = true;
    }
    setProviders(newProviders);
  };

  const addProvider = () => {
    setProviders([...providers, {
      id: crypto.randomUUID(),
      type: "openrouter",
      modelName: "",
      apiKey: "",
      isDefault: providers.length === 0
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_providers: JSON.stringify(providers),
          daily_token_quota: dailyTokenQuota,
          max_concurrent: maxConcurrentExecutions,
          error_webhooks: errorWebhooks.toString(),
          strict_logging: strictLogging.toString(),
          ai_cost_limit: aiCostLimit
        }),
      });
      
      if (res.ok) {
        alert("Settings saved successfully!");
        window.location.reload();
      } else {
        alert("Failed to save settings");
      }
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (type: string) => {
    if (type === "openai") {
      return (
        <div className="w-10 h-10 bg-[#202123] border border-slate-300 rounded-md flex items-center justify-center p-2 text-white">
          <div className="w-full h-full border-[1.5px] border-white"></div>
        </div>
      );
    }
    if (type === "anthropic") {
      return (
        <div className="w-10 h-10 bg-[#f0eee4] rounded-md flex items-center justify-center text-[#d18e76] font-bold text-[10px] tracking-tighter leading-none border border-slate-200">
          CLAUDE
        </div>
      );
    }
    return (
      <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 border border-slate-200">
        <Bot size={20} />
      </div>
    );
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 space-y-4 md:space-y-0">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Platform Settings</h1>
          <p className="text-slate-500 mt-2 font-medium">Manage your global AI model providers, API authentication, and system-wide execution limits for automated content pipelines.</p>
        </div>
        <button 
          type="submit" 
          disabled={loading} 
          className="flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
        >
          <Save size={18} />
          <span>{loading ? "Saving..." : "Save Changes"}</span>
        </button>
      </header>

      <CostBlockWarning spent={spent} limit={parseFloat(aiCostLimit) || 10} blocked={blocked} override={overridden} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Providers Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <div className="flex items-center space-x-3 font-bold text-slate-900 text-lg">
                <Bot size={20} className="text-indigo-600" />
                <span>AI Providers</span>
              </div>
              <button type="button" onClick={addProvider} className="text-indigo-700 hover:text-indigo-900 font-bold text-sm flex items-center space-x-1 transition-colors">
                <Plus size={16} /><span>Add Provider</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {providers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Bot className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">No AI Providers Configured</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">You need to add at least one AI provider (like OpenAI or Anthropic) to run automated workflows.</p>
                  <button type="button" onClick={addProvider} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Add Your First AI Provider
                  </button>
                </div>
              ) : (
                providers.map((provider, index) => {
                  const isConfigured = provider.apiKey.length > 5 && !provider.apiKey.includes("mock-key");

                  return (
                    <div key={provider.id} className={`border rounded-xl p-5 bg-white relative transition-all flex flex-col sm:flex-row items-stretch sm:items-start gap-4 ${!isConfigured ? 'border-orange-200' : 'border-slate-200'}`}>
                      
                      {/* Icon */}
                      <div className="self-start sm:self-auto">
                        {getProviderIcon(provider.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select 
                              value={provider.type} 
                              onChange={(e) => handleProviderChange(index, "type", e.target.value)}
                              className="font-bold text-slate-900 text-base capitalize bg-transparent focus:outline-none cursor-pointer hover:bg-slate-50 rounded px-1 -ml-1"
                            >
                              <option value="openai">OpenAI</option>
                              <option value="anthropic">Anthropic</option>
                              <option value="openrouter">OpenRouter</option>
                            </select>
                            {isConfigured ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">Connected</span>
                            ) : (
                              <span className="bg-orange-50 text-orange-700 border border-orange-100 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded uppercase">Invalid Key</span>
                            )}
                          </div>

                          {/* Default Toggle */}
                          <div className="flex items-center space-x-3 self-end sm:self-auto">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={provider.isDefault} onChange={() => setAsDefault(index)} />
                              <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${provider.isDefault ? "bg-indigo-600 after:translate-x-full after:border-white" : "bg-slate-200"}`}></div>
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full max-w-lg">
                          <div className="flex flex-col flex-1 space-y-2">
                            <input 
                              type="text" 
                              value={provider.modelName}
                              onChange={(e) => handleProviderChange(index, "modelName", e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                              placeholder="Model (e.g., gpt-4o, claude-3-5-sonnet)"
                            />
                            <div className={`flex items-center border rounded-md bg-slate-50 px-3 py-2 ${!isConfigured ? 'border-red-300' : 'border-slate-200'}`}>
                              <input 
                                type={visibleKeys[provider.id] ? "text" : "password"}
                                value={provider.apiKey}
                                onChange={(e) => handleProviderChange(index, "apiKey", e.target.value)}
                                className="w-full bg-transparent focus:outline-none text-sm font-mono tracking-widest text-slate-600"
                                placeholder="sk-..."
                              />
                              <button
                                type="button"
                                onClick={() => toggleKeyVisibility(provider.id)}
                                className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2"
                                title={visibleKeys[provider.id] ? "Hide API Key" : "Show API Key"}
                              >
                                {visibleKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => requestDeleteProvider(index)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors self-end sm:self-center mb-2"
                            title="Delete Provider"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>



        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI Spending Limits Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex items-center space-x-3 font-bold text-slate-900 text-lg">
              <Activity size={20} className="text-indigo-600" />
              <span>AI Cost Control</span>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-bold text-slate-900">Total Spent (USD)</label>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase">Current Spend</span>
                </div>
                <p className="text-2xl font-black text-slate-900">${spent.toFixed(4)}</p>
                <p className="text-xs text-slate-500 mt-1">Accumulated cost estimated from token usage metrics.</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-900">Soft Cost Limit ($)</label>
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase">Threshold</span>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  value={aiCostLimit} 
                  onChange={(e) => setAiCostLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
                  placeholder="10.00"
                />
                <p className="text-xs text-slate-500">Soft block is triggered once this spending limit is crossed.</p>
              </div>

              {spent > 0 && (
                <button
                  type="button"
                  onClick={handleResetSpend}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Reset Spend Counter
                </button>
              )}
            </div>
          </div>

          {/* System Limits */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex items-center space-x-3 font-bold text-slate-900 text-lg">
              <Activity size={20} className="text-indigo-600" />
              <span>System Limits</span>
            </div>
            
            <div className="p-6 space-y-8">
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-900">Daily Token Quota</label>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">Soft Limit</span>
                </div>
                <input 
                  type="number" 
                  value={dailyTokenQuota} 
                  onChange={(e) => setDailyTokenQuota(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-mono"
                />
                <p className="text-xs text-slate-500">System will pause non-critical workflows when exceeded.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 block">Max Concurrent Executions</label>
                <div className="flex flex-wrap gap-2">
                  {["5", "10", "25", "50", "100"].map((val) => (
                    <button 
                      key={val} 
                      type="button" 
                      onClick={() => setMaxConcurrentExecutions(val)}
                      className={`flex-1 min-w-[50px] py-1.5 text-xs font-bold rounded border transition-colors ${maxConcurrentExecutions === val ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Controls how many AI worker threads can run at once.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Error Webhooks</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Trigger configured webhooks on execution failure</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={errorWebhooks} onChange={(e) => setErrorWebhooks(e.target.checked)} />
                    <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${errorWebhooks ? "bg-indigo-600 after:translate-x-full after:border-white" : "bg-slate-200"}`}></div>
                  </label>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Strict Logging</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Keep full prompt/response history</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={strictLogging} onChange={(e) => setStrictLogging(e.target.checked)} />
                    <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${strictLogging ? "bg-indigo-600 after:translate-x-full after:border-white" : "bg-slate-200"}`}></div>
                  </label>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </form>

      {/* Delete Provider Confirmation Modal */}
      {providerToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Delete AI Provider</h3>
                  <p className="text-sm font-medium text-red-600 mt-1">This action cannot be undone.</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setProviderToDelete(null)} 
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 space-y-4">
              <p className="text-slate-700 text-sm">
                You are about to delete the <strong>{providers[providerToDelete]?.type?.toUpperCase()}</strong> configuration (Model: {providers[providerToDelete]?.modelName || "unspecified"}). Workflows referencing this provider will fall back to the default provider.
              </p>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-bold text-slate-700">
                  Please type <span className="text-slate-900 font-black bg-white px-1.5 py-0.5 rounded border border-slate-200">DELETE</span> to confirm.
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setProviderToDelete(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteProvider}
                disabled={deleteConfirmText !== "DELETE"}
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
