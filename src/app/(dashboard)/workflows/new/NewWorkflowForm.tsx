"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Rss, Send, Bot, Clock, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";
import CronBuilder from "../CronBuilder";

type Integration = {
  id: string;
  name: string;
  type: string;
};

export default function NewWorkflowForm({ integrations, aiProviders = [] }: { integrations: Integration[], aiProviders?: { id: string, name: string, type?: string, modelName?: string, isDefault?: boolean }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cronSchedule, setCronSchedule] = useState("0 8 * * *");
  const [feeds, setFeeds] = useState([{ url: "", label: "" }]);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [aiProviderId, setAiProviderId] = useState<string>("");
  const [destinationConfigs, setDestinationConfigs] = useState<Record<string, unknown>>({});
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [generateImages, setGenerateImages] = useState(false);
  const [cmsContentFormat, setCmsContentFormat] = useState("LEXICAL");
  const [includeSourceLink, setIncludeSourceLink] = useState(false);
  const [scrapeFullContent, setScrapeFullContent] = useState(false);
  
  // New generation mode states
  const [generationMode, setGenerationMode] = useState("ROUNDUP");
  const [maxIndividualPosts, setMaxIndividualPosts] = useState(5);
  const [enableStrictFiltering, setEnableStrictFiltering] = useState(true);
  const [useNofollowLinks, setUseNofollowLinks] = useState(true);
  
  const [loading, setLoading] = useState(false);

  const handleAddFeed = () => setFeeds([...feeds, { url: "", label: "" }]);
  
  const handleRemoveFeed = (index: number) => setFeeds(feeds.filter((_, i) => i !== index));

  const handleFeedChange = (index: number, field: "url" | "label", value: string) => {
    const newFeeds = [...feeds];
    newFeeds[index][field] = value;
    setFeeds(newFeeds);
  };

  const toggleIntegration = (id: string) => {
    if (selectedIntegrations.includes(id)) {
      setSelectedIntegrations(selectedIntegrations.filter((i) => i !== id));
    } else {
      setSelectedIntegrations([...selectedIntegrations, id]);
    }
  };

  const handleSave = async (e: React.FormEvent, isActive: boolean = true) => {
    e.preventDefault();
    setLoading(true);
    const validFeeds = feeds.filter(f => f.url.trim() !== "");

    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, cronSchedule, feeds: validFeeds, integrationIds: selectedIntegrations, 
          destinationConfigs, aiProviderId, logoUrl, systemPrompt, isActive, 
          generateImages, cmsContentFormat, includeSourceLink, scrapeFullContent,
          generationMode, maxIndividualPosts, enableStrictFiltering, useNofollowLinks
        }),
      });

      if (res.ok) {
        router.push("/workflows");
        router.refresh();
      } else {
        alert("Failed to create workflow");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="w-full max-w-7xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Workflow</h1>
          <p className="text-slate-500 mt-1 font-medium">Configure a new automated content pipeline.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link href="/workflows" className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-bold transition-colors shadow-sm text-sm">
            Cancel
          </Link>
          <button 
            type="button" 
            onClick={(e) => handleSave(e, false)}
            disabled={loading || selectedIntegrations.length === 0} 
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm border border-slate-200"
          >
            <span>{loading ? "Saving..." : "Save as Draft"}</span>
          </button>
          <button 
            type="button" 
            onClick={(e) => handleSave(e, true)}
            disabled={loading || selectedIntegrations.length === 0} 
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <Save size={16} />
            <span>{loading ? "Saving..." : "Activate Workflow"}</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. AI Processing */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <Bot size={20} className="text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">1. Configuration & AI</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  WORKFLOW NAME
                </label>
                <input 
                  required 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Tech Startup News Daily"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  MODEL OVERRIDE
                </label>
                <select 
                  value={aiProviderId} 
                  onChange={(e) => setAiProviderId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors"
                >
                  <option value="">Default Provider (From Settings)</option>
                  {aiProviders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.type.charAt(0).toUpperCase() + p.type.slice(1)} - {p.modelName} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  BUSINESS LOGO URL (FOR IMAGE GENERATION)
                </label>
                <input 
                  type="url" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors" 
                />
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  CUSTOM SYSTEM PROMPT TEMPLATE
                </label>
                <textarea 
                  value={systemPrompt} 
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Leave empty to use the default prompt."
                  rows={6}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors font-mono" 
                />
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Available Shortcodes:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><code className="bg-slate-100 px-1 py-0.5 rounded">{"{{stories}}"}</code> <strong>(Mandatory)</strong>: Injects the fetched RSS news articles (Title, snippet, link, source).</li>
                      <li><code className="bg-slate-100 px-1 py-0.5 rounded">{"{{logo}}"}</code>: Injects a markdown image of your Business Logo URL (e.g. <code>![Logo](url)</code>).</li>
                      <li><code className="bg-slate-100 px-1 py-0.5 rounded">{"{{websiteInstructions}}"}</code>: Injects &quot;Generate a full-length...&quot; if a CMS is connected, or &quot;Generate a short summary&quot; if not.</li>
                      <li><code className="bg-slate-100 px-1 py-0.5 rounded">{"{{socialInstructions}}"}</code>: Injects instructions to write a 280-char social post if Twitter/LinkedIn are connected, else tells it to skip.</li>
                    </ul>
                  </div>
                  <details>
                    <summary className="cursor-pointer font-medium text-indigo-600 hover:text-indigo-700">View Default Prompt & JSON Format Requirements</summary>
                    <pre className="mt-2 p-2 bg-slate-100 rounded border border-slate-200 text-[10px] overflow-x-auto whitespace-pre-wrap">
{`You are an expert tech journalist and social media manager.
I have the following recent news stories:

{{stories}}

Please synthesize this into a curated news roundup. 
{{websiteInstructions}}
{{socialInstructions}}

Return the result strictly as a JSON object with the following fields:
- title: The headline for the roundup
- summary: A short 1-2 sentence summary
- content: The markdown content
- sourceUrl: The primary original source URL (if requested)
- metaTitle: SEO title (max 60 chars)
- metaDescription: SEO description (max 150 chars)
- tags: Comma separated tags
- socialText: The short social media post text (leave empty if not requested)`}
                    </pre>
                  </details>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    CMS CONTENT FORMAT
                  </label>
                  <select
                    value={cmsContentFormat}
                    onChange={(e) => setCmsContentFormat(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors"
                  >
                    <option value="HTML">HTML format (WordPress, Ghost default)</option>
                    <option value="LEXICAL">Lexical RichText JSON (Payload CMS default)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    GENERATION MODE
                  </label>
                  <select
                    value={generationMode}
                    onChange={(e) => setGenerationMode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors"
                  >
                    <option value="ROUNDUP">Single Roundup Post (Merge all feeds)</option>
                    <option value="INDIVIDUAL">Individual Posts (One post per feed)</option>
                    <option value="BOTH">Single Master Post + Individual Posts</option>
                  </select>
                </div>
                
                {(generationMode === 'INDIVIDUAL' || generationMode === 'BOTH') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      MAX INDIVIDUAL POSTS
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      max="20"
                      value={maxIndividualPosts} 
                      onChange={(e) => setMaxIndividualPosts(parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors" 
                    />
                    <p className="text-[10px] text-slate-500 mt-1">If there are 10 feeds, but max is 5, only the top 5 scoring feeds will be processed individually.</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      HERO IMAGE GENERATION
                    </label>
                    <span className="text-xs text-slate-500 font-medium">Generate a custom AI hero image for each published blog post.</span>
                  </div>
                  <div 
                    onClick={() => setGenerateImages(!generateImages)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      generateImages ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div 
                      className={`absolute top-0.5 left-0.5 bg-white border border-slate-300 rounded-full h-5 w-5 transition-transform ${
                        generateImages ? 'translate-x-5 border-indigo-600' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start space-x-3">
                  <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Note: Image generation is not robust</p>
                    <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                      AI image engines can fail due to API limits or credit issues. The pipeline handles this gracefully by skipping image generation and publishing without an image.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      STRICT AI FILTERING
                    </label>
                    <span className="text-xs text-slate-500 font-medium">Block completely off-topic items and YouTube videos.</span>
                  </div>
                  <div 
                    onClick={() => setEnableStrictFiltering(!enableStrictFiltering)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      enableStrictFiltering ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div 
                      className={`absolute top-0.5 left-0.5 bg-white border border-slate-300 rounded-full h-5 w-5 transition-transform ${
                        enableStrictFiltering ? 'translate-x-5 border-indigo-600' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">If disabled, all fetched articles will be processed regardless of topic relevance. Useful for highly curated or official department feeds.</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    CITE SOURCE LINKS
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Instruct the AI to embed hyperlinks back to the original source articles.</span>
                </div>
                <div 
                  onClick={() => setIncludeSourceLink(!includeSourceLink)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    includeSourceLink ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <div 
                    className={`absolute top-0.5 left-0.5 bg-white border border-slate-300 rounded-full h-5 w-5 transition-transform ${
                      includeSourceLink ? 'translate-x-5 border-indigo-600' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {includeSourceLink && (
                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      USE NOFOLLOW LINKS
                    </label>
                    <span className="text-xs text-slate-500 font-medium">Add rel=&quot;nofollow&quot; to source links (Recommended for SEO).</span>
                  </div>
                  <div 
                    onClick={() => setUseNofollowLinks(!useNofollowLinks)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      useNofollowLinks ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div 
                      className={`absolute top-0.5 left-0.5 bg-white border border-slate-300 rounded-full h-5 w-5 transition-transform ${
                        useNofollowLinks ? 'translate-x-5 border-indigo-600' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    SCRAPE FULL CONTENT
                  </label>
                  <span className="text-xs text-slate-500 font-medium">Scrape and feed full article contents to the AI instead of just the snippet.</span>
                </div>
                <div 
                  onClick={() => setScrapeFullContent(!scrapeFullContent)}
                  className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                    scrapeFullContent ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                >
                  <div 
                    className={`absolute top-0.5 left-0.5 bg-white border border-slate-300 rounded-full h-5 w-5 transition-transform ${
                      scrapeFullContent ? 'translate-x-5 border-indigo-600' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* 2. Feed Sources */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <Rss size={20} className="text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">2. Feed Sources</h2>
            </div>
            <div className="p-6 space-y-4">
              {feeds.map((feed, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {index === 0 ? "PRIMARY RSS URL" : `ADDITIONAL URL ${index + 1}`}
                  </label>
                  <div className="flex space-x-2">
                    <input 
                      required 
                      type="url" 
                      value={feed.url} 
                      onChange={(e) => handleFeedChange(index, "url", e.target.value)} 
                      placeholder="https://example.com/feed.xml" 
                      className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-slate-50/50 transition-colors" 
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveFeed(index)} 
                      className="p-2.5 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-colors flex-shrink-0 bg-slate-50/50"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                onClick={handleAddFeed} 
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 text-sm font-bold pt-2 transition-colors"
              >
                <Plus size={16} /> <span>Add another feed</span>
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 3. Destinations */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <Send size={18} className="text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">3. Destinations</h2>
            </div>
            <div className="p-4 space-y-3">
              {integrations.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm">No destinations available.</p>
                  <Link href="/integrations" className="text-indigo-600 font-bold text-sm mt-2 block">Connect one</Link>
                </div>
              ) : (
                integrations.map((integration) => {
                  const isChecked = selectedIntegrations.includes(integration.id);
                  let displayType = integration.type.charAt(0).toUpperCase() + integration.type.slice(1);
                  if (integration.type === "twitter") displayType = "Twitter / X";
                  if (integration.type === "wordpress") displayType = "WordPress";

                  return (
                    <div key={integration.id} className={`relative flex flex-col p-4 border rounded-lg transition-all ${
                      isChecked ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}>
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => toggleIntegration(integration.id)} 
                          className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" 
                        />
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 text-sm flex justify-between items-center">
                            {displayType}
                            <ExternalLink size={14} className="text-slate-400" />
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{integration.name}</div>
                        </div>
                      </label>
                      
                      {isChecked && (integration as { categoryMappings?: unknown[] }).categoryMappings && ((integration as { categoryMappings?: unknown[] }).categoryMappings?.length || 0) > 0 && (
                        <div className="mt-4 ml-7">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Force Category Mapping</label>
                          <select 
                            className="w-full text-sm border-slate-200 rounded-md py-1.5 px-3 bg-white"
                            value={destinationConfigs[integration.id]?.selectedMappingName || ""}
                            onChange={(e) => {
                              setDestinationConfigs(prev => ({
                                ...prev,
                                [integration.id]: {
                                  ...prev[integration.id],
                                  selectedMappingName: e.target.value
                                }
                              }))
                            }}
                          >
                            <option value="">Auto-Assign via AI (Recommended)</option>
                            {((integration as { categoryMappings?: { id: string, name: string }[] }).categoryMappings || []).map((mapping, idx) => (
                              <option key={idx} value={mapping.name}>{mapping.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Schedule */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <Clock size={18} className="text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">4. Run Schedule</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <CronBuilder value={cronSchedule} onChange={setCronSchedule} />
              </div>
              
              {cronSchedule === "manual" ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 mt-4">
                  <Clock size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Manual Trigger Only</p>
                    <p className="text-xs text-amber-700 mt-0.5">This workflow will not run on a schedule. Trigger it using the <strong>Run Now</strong> button.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start space-x-3 mt-4">
                  <Clock size={16} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Scheduled to run based on</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">the above schedule frequency.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
