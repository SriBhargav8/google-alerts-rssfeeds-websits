"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Key } from "lucide-react";

export default function NewIntegrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("wordpress");
  const [credentials, setCredentials] = useState<Record<string, any>>({});
  const [categoryMappings, setCategoryMappings] = useState<any[]>([]);

  const handleCredentialChange = (key: string, value: any) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, credentials: { ...credentials, categoryMappings } }),
      });

      if (res.ok) {
        router.push("/integrations");
        router.refresh();
      } else {
        alert("Failed to save integration");
      }
    } catch (err) {
      alert("Error saving integration");
    } finally {
      setLoading(false);
    }
  };

  // Reset credentials when type changes
  const handleTypeChange = (newType: string) => {
    setType(newType);
    setCredentials({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3">
            <Link href="/integrations" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Connect Integration</h1>
          </div>
          <p className="text-slate-500 mt-2 font-medium ml-9">Add a CMS or Social Media account as a publishing destination.</p>
        </div>
        <button type="submit" disabled={loading} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap">
          <Save size={18} />
          <span>{loading ? "Connecting..." : "Save Integration"}</span>
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Key size={20} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Connection Details</h2>
            <p className="text-sm text-slate-500">Provide the API credentials for this platform.</p>
          </div>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Display Name</label>
            <input 
              required type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Personal Tech Blog"
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Platform Type</label>
            <select 
              value={type} onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
            >
              <optgroup label="CMS">
                <option value="wordpress">WordPress (REST API)</option>
                <option value="payloadcms">Payload CMS</option>
                <option value="ghost">Ghost</option>
                <option value="webflow">Webflow</option>
                <option value="webhook">Custom Webhook</option>
              </optgroup>
              <optgroup label="Social & Publishing">
                <option value="twitter">Twitter / X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="facebook">Facebook Pages</option>
                <option value="medium">Medium</option>
              </optgroup>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-6">
            {type === "wordpress" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">WordPress Site URL</label>
                  <input required type="url" placeholder="https://myblog.com" value={credentials.url || ""} onChange={e => handleCredentialChange("url", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Admin Username</label>
                    <input required type="text" placeholder="admin" value={credentials.username || ""} onChange={e => handleCredentialChange("username", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Application Password</label>
                    <input required type="password" placeholder="xxxx xxxx xxxx xxxx" value={credentials.password || ""} onChange={e => handleCredentialChange("password", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                  </div>
                </div>
              </>
            )}

            {type === "payloadcms" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Payload Collection API URL</label>
                  <input required type="url" placeholder="https://legalsuvidha.com/api/blogs" value={credentials.url || ""} onChange={e => handleCredentialChange("url", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Admin Email</label>
                    <input required type="email" placeholder="admin@example.com" value={credentials.email || ""} onChange={e => handleCredentialChange("email", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Admin Password</label>
                    <input required type="password" placeholder="••••••••" value={credentials.password || ""} onChange={e => handleCredentialChange("password", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Default Category IDs (Optional)</label>
                    <input type="text" placeholder="e.g. 10, 15, 20" value={credentials.categoryId || ""} onChange={e => handleCredentialChange("categoryId", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                    <p className="text-xs text-slate-500">Comma-separated category IDs</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Default Author ID (Optional)</label>
                    <input type="text" placeholder="e.g. 2 or author-id" value={credentials.authorId || ""} onChange={e => handleCredentialChange("authorId", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                    <p className="text-xs text-slate-500">ID of the user who authors the post</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">Category Mappings (Optional)</h3>
                      <p className="text-xs text-slate-500">Provide category names and IDs so AI can auto-assign the best match based on content.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCategoryMappings([...categoryMappings, { name: "", categoryId: "", authorId: "" }])}
                      className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold transition-colors"
                    >
                      + Add Mapping
                    </button>
                  </div>
                  
                  {categoryMappings.length > 0 && (
                    <div className="space-y-3">
                      {categoryMappings.map((map, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <input 
                            placeholder="Category Name (e.g. Tax News)" 
                            value={map.name} 
                            onChange={e => {
                              const newMappings = [...categoryMappings];
                              newMappings[idx].name = e.target.value;
                              setCategoryMappings(newMappings);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                          <input 
                            placeholder="Category ID" 
                            value={map.categoryId} 
                            onChange={e => {
                              const newMappings = [...categoryMappings];
                              newMappings[idx].categoryId = e.target.value;
                              setCategoryMappings(newMappings);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                          <input 
                            placeholder="Author ID" 
                            value={map.authorId} 
                            onChange={e => {
                              const newMappings = [...categoryMappings];
                              newMappings[idx].authorId = e.target.value;
                              setCategoryMappings(newMappings);
                            }}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                          />
                          <button 
                            type="button" 
                            onClick={() => setCategoryMappings(categoryMappings.filter((_, i) => i !== idx))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {type === "twitter" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">API Key</label>
                  <input required type="password" value={credentials.apiKey || ""} onChange={e => handleCredentialChange("apiKey", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">API Secret</label>
                  <input required type="password" value={credentials.apiSecret || ""} onChange={e => handleCredentialChange("apiSecret", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Access Token</label>
                  <input required type="password" value={credentials.accessToken || ""} onChange={e => handleCredentialChange("accessToken", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Access Secret</label>
                  <input required type="password" value={credentials.accessSecret || ""} onChange={e => handleCredentialChange("accessSecret", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
              </div>
            )}

            {type === "linkedin" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Access Token</label>
                  <input required type="password" value={credentials.accessToken || ""} onChange={e => handleCredentialChange("accessToken", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">URN (Author or Organization ID)</label>
                  <input required type="text" placeholder="urn:li:person:XXXXX" value={credentials.urn || ""} onChange={e => handleCredentialChange("urn", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
              </>
            )}

            {type === "facebook" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Page Access Token</label>
                  <input required type="password" value={credentials.accessToken || ""} onChange={e => handleCredentialChange("accessToken", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Page ID</label>
                  <input required type="text" placeholder="104XXXXX" value={credentials.pageId || ""} onChange={e => handleCredentialChange("pageId", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
              </>
            )}

            {type === "medium" && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Integration Token</label>
                <input required type="password" placeholder="2a2b..." value={credentials.integrationToken || ""} onChange={e => handleCredentialChange("integrationToken", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
              </div>
            )}

            {type === "ghost" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Ghost Admin API URL</label>
                  <input required type="url" placeholder="https://myblog.ghost.io" value={credentials.url || ""} onChange={e => handleCredentialChange("url", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Admin API Key</label>
                  <input required type="password" placeholder="64b...:e43..." value={credentials.apiKey || ""} onChange={e => handleCredentialChange("apiKey", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
              </>
            )}

            {type === "webflow" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">API Token</label>
                  <input required type="password" placeholder="Bearer Token" value={credentials.apiToken || ""} onChange={e => handleCredentialChange("apiToken", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Site ID</label>
                  <input required type="text" placeholder="64a..." value={credentials.siteId || ""} onChange={e => handleCredentialChange("siteId", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Collection ID (e.g. Blog Posts)</label>
                  <input required type="text" placeholder="64b..." value={credentials.collectionId || ""} onChange={e => handleCredentialChange("collectionId", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
              </>
            )}

            {type === "webhook" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">POST URL</label>
                  <input required type="url" placeholder="https://api.example.com/webhook" value={credentials.url || ""} onChange={e => handleCredentialChange("url", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Authorization Header (Optional)</label>
                  <input type="text" placeholder="Bearer sk-..." value={credentials.authHeader || ""} onChange={e => handleCredentialChange("authHeader", e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
