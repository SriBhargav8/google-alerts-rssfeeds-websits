"use client";

import { Link as LinkIcon, Search, Globe, Briefcase, MessageSquare, Database, PlusCircle, Link2Off, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IntegrationsClient({ integrations }: { integrations: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [integrationToDelete, setIntegrationToDelete] = useState<any | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const requestDisconnect = (integration: any) => {
    setIntegrationToDelete(integration);
    setDeleteConfirmText("");
  };

  const confirmDisconnect = async () => {
    if (!integrationToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/integrations/${integrationToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Integration disconnected successfully!");
        setIntegrationToDelete(null);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to disconnect integration");
      }
    } catch (e) {
      alert("Error disconnecting integration");
    } finally {
      setDeleting(false);
    }
  };

  const getIntegrationUI = (integration: any) => {
    const type = integration.type.toLowerCase();
    
    let status = "Connected";
    let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
    let dotColor = "bg-emerald-500";
    
    let title = type.charAt(0).toUpperCase() + type.slice(1);
    let icon = <Globe size={20} className="text-blue-600" />;
    let iconBg = "bg-blue-50";
    if (type === "wordpress") {
      title = "WordPress";
    } else if (type === "twitter") {
      title = "X (Twitter)";
      icon = <span className="font-bold text-white leading-none">X</span>;
      iconBg = "bg-[#0F1419]";
    } else if (type === "linkedin") {
      title = "LinkedIn";
      icon = <Briefcase size={20} className="text-blue-700" />;
    } else if (type === "webflow") {
      title = "Webflow";
      icon = <span className="font-bold text-blue-600 leading-none">W</span>;
    } else if (type === "slack") {
      title = "Slack";
      icon = <MessageSquare size={20} className="text-pink-600" />;
      iconBg = "bg-pink-50";
    } else if (type === "payloadcms") {
      title = "Payload CMS";
      icon = <Database size={20} className="text-purple-600" />;
      iconBg = "bg-purple-50";
    } else if (type === "facebook") {
      title = "Facebook";
      iconBg = "bg-blue-100";
    } else if (type === "ghost") {
      title = "Ghost";
    } else if (type === "medium") {
      title = "Medium";
    }

    return { title, icon, iconBg, status, statusColor, dotColor };
  };

  const processed = integrations.map(int => ({ ...int, ui: getIntegrationUI(int) }));
  
  const filtered = processed.filter(int => {
    return int.ui.title.toLowerCase().includes(searchQuery.toLowerCase()) || int.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between md:items-start space-y-4 md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
            <LinkIcon size={24} className="text-indigo-600" />
            <span>Integrations</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage connected platforms and publishing destinations.</p>
        </div>
        <Link 
          href="/integrations/new" 
          className="flex items-center space-x-2 bg-[#4F4DF8] hover:bg-[#605eff] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
        >
          <PlusCircle size={16} />
          <span>Connect New</span>
        </Link>
      </header>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex items-center">
        <div className="w-full flex items-center gap-3">
          <div className="relative flex-1 max-w-2xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter integrations..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-700 transition-all"
            />
          </div>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-2 whitespace-nowrap">
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {filtered.map((integration) => {
          const { title, icon, iconBg, status, statusColor, dotColor } = integration.ui;

          return (
            <div key={integration.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col relative transition-shadow hover:shadow-md group">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg} shadow-sm border border-slate-100`}>
                  {icon}
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center border ${statusColor}`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColor}`}></div>
                  {status}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1 truncate">{integration.name}</p>
              </div>
              
              <div className="mt-6 flex justify-between items-center border-t border-slate-100 pt-5 mt-auto">
                <Link href={`/integrations/${integration.id}`} className="text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors flex items-center space-x-1">
                  <span>Configure</span>
                </Link>
                <button 
                  onClick={() => requestDisconnect(integration)} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                  title="Disconnect"
                >
                  <Link2Off size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full bg-white border-2 border-slate-100 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-4">
              <Search size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Integrations Found</h3>
            <p className="text-slate-500 mt-2 max-w-md font-medium">Try adjusting your search or filter criteria, or connect a new one.</p>
            <Link 
              href="/integrations/new" 
              className="mt-6 flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              <PlusCircle size={18} className="text-indigo-600" />
              <span>Connect New Integration</span>
            </Link>
          </div>
        )}

      </div>

      {/* Disconnect Integration Modal */}
      {integrationToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 text-red-600 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Disconnect Integration</h3>
                  <p className="text-sm font-medium text-red-600 mt-1">This action cannot be undone.</p>
                </div>
              </div>
              <button 
                onClick={() => setIntegrationToDelete(null)} 
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 space-y-4">
              <p className="text-slate-700 text-sm">
                You are about to completely disconnect the <strong>{integrationToDelete.name}</strong> connection ({integrationToDelete.ui.title}). <strong>All workflows sending content to this destination will fail</strong> unless reconfigured.
              </p>
              
              <div className="space-y-2 mt-4">
                <label className="text-sm font-bold text-slate-700">
                  Please type <span className="text-slate-900 font-black bg-white px-1.5 py-0.5 rounded border border-slate-200">DISCONNECT</span> to confirm.
                </label>
                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DISCONNECT"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 text-sm transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end space-x-3">
              <button 
                onClick={() => setIntegrationToDelete(null)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDisconnect}
                disabled={deleteConfirmText !== "DISCONNECT" || deleting}
                className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                {deleting ? "Disconnecting..." : "Confirm Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
