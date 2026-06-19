import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Play, Pause, ChevronRight, Activity, Rss, Send, Clock, Bot, CheckCircle2, ChevronRight as ChevronRightIcon, ExternalLink, Globe, Briefcase, MessageSquare, History } from "lucide-react";
import RunWorkflowButton from "./RunWorkflowButton";
import PauseResumeButton from "./PauseResumeButton";

function formatCron(cron: string) {
  if (cron === "*/15 * * * *") return "Every 15m";
  if (cron === "*/30 * * * *") return "Every 30m";
  if (cron === "0 * * * *") return "Hourly";
  if (cron === "0 0 * * *") return "Daily at Midnight";
  if (cron === "0 12 * * *") return "Daily at Noon";
  
  const dailyMatch = cron.match(/^0 (\d+) \* \* \*$/);
  if (dailyMatch) {
    const hour = parseInt(dailyMatch[1], 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `Daily at ${displayHour}:00 ${ampm}`;
  }

  return cron;
}

export default async function ViewWorkflowPage({ params }: { params: { id: string } }) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      feeds: true,
      destinations: { include: { integration: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  if (!workflow) notFound();

  const totalRuns = await prisma.workflowRun.count({
    where: { workflowId: workflow.id }
  });

  const totalProcessed = await prisma.rssItem.count({
    where: { feed: { workflowId: workflow.id }, processed: true }
  });

  const aiSettings = await prisma.appSettings.findUnique({ where: { key: "ai_providers" } });
  let aiModelDisplay = "GPT-4o";
  try {
    if (aiSettings?.value) {
      const providers = JSON.parse(aiSettings.value);
      let provider = null;
      if (workflow.aiProviderId) {
        provider = providers.find((p: any) => p.id === workflow.aiProviderId);
      }
      if (!provider) {
        provider = providers.find((p: any) => p.isDefault);
      }
      if (provider) {
        aiModelDisplay = provider.modelName || provider.type;
      }
    }
  } catch (e) {}

  const formatDuration = (ms: number | null) => {
    if (!ms) return "--";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getIntegrationIcon = (type: string) => {
    if (type === "wordpress") return <div className="w-6 h-6 bg-[#0073AA] rounded text-white flex items-center justify-center text-[10px] font-bold">*</div>;
    if (type === "twitter") return <div className="w-6 h-6 bg-black rounded text-white flex items-center justify-center text-[10px] font-bold">@</div>;
    if (type === "linkedin") return <div className="w-6 h-6 bg-[#0077B5] rounded text-white flex items-center justify-center text-[10px] font-bold">in</div>;
    return <div className="w-6 h-6 bg-slate-200 rounded text-slate-500 flex items-center justify-center text-[10px] font-bold">#</div>;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-4">
        <span className="text-slate-900 font-bold">AutoFeed</span>
        <ChevronRight size={14} />
        <Link href="/workflows" className="hover:text-slate-900 transition-colors">Workflows</Link>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-bold">{workflow.name}</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{workflow.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest flex items-center border uppercase ${
              workflow.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}>
              {workflow.isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>}
              {workflow.isActive ? "ACTIVE" : "PAUSED"}
            </span>
          </div>
          <p className="text-slate-500 mt-2 font-medium">Automated scraping, summarization, and distribution pipeline.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <PauseResumeButton workflowId={workflow.id} initialActive={workflow.isActive} />
          <RunWorkflowButton workflowId={workflow.id} />
        </div>
      </header>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
        
        {/* OPERATIONAL METRICS */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">OPERATIONAL METRICS</h2>
          </div>
          <div className="p-6 flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">Total Runs</p>
                <p className="text-2xl font-extrabold text-slate-900">{totalRuns}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-500 mb-1">Processed</p>
                <p className="text-2xl font-extrabold text-slate-900">{totalProcessed}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 text-slate-600 text-sm font-medium">
                  <Clock size={16} className="text-slate-400" />
                  <span>Schedule</span>
                </div>
                <div className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded font-mono text-xs" title={`Raw CRON: ${workflow.cronSchedule}`}>
                  {formatCron(workflow.cronSchedule)}
                </div>
              </div>
              
              <div className="flex justify-between items-center pb-2">
                <div className="flex items-center space-x-2 text-slate-600 text-sm font-medium">
                  <Bot size={16} className="text-slate-400" />
                  <span>AI Engine</span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {aiModelDisplay}
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100">
            <Link href={`/workflows/${workflow.id}/runs`} className="w-full flex items-center justify-center py-2.5 border border-indigo-200 text-indigo-700 font-bold text-sm rounded-lg hover:bg-indigo-50 transition-colors">
              View Full Metrics
            </Link>
          </div>
        </div>

        {/* PIPELINE CONFIGURATION */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">PIPELINE CONFIGURATION</h2>
            <Link href={`/workflows/${workflow.id}/edit`} className="text-indigo-700 text-xs font-bold hover:underline">
              Edit Configuration
            </Link>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            {/* Feed Sources */}
            <div>
              <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 mb-4">
                <Rss size={18} className="text-indigo-600" />
                <span>Feed Sources</span>
              </h3>
              <div className="space-y-3">
                {workflow.feeds.map(feed => (
                  <div key={feed.id} className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-md p-3">
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-700 truncate font-medium">{feed.url}</span>
                  </div>
                ))}
                {workflow.feeds.length === 0 && <p className="text-sm text-slate-500 italic">No sources configured.</p>}
              </div>
            </div>

            {/* Publishing Destinations */}
            <div>
              <h3 className="flex items-center space-x-2 text-sm font-bold text-slate-900 mb-4">
                <Send size={18} className="text-indigo-600" />
                <span>Publishing Destinations</span>
              </h3>
              <div className="space-y-3">
                {workflow.destinations.map(d => {
                  let displayType = d.integration.type.charAt(0).toUpperCase() + d.integration.type.slice(1);
                  if (d.integration.type === "twitter") displayType = "X/Twitter";
                  if (d.integration.type === "wordpress") displayType = "WordPress";

                  return (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-md p-3">
                      <div className="flex items-center space-x-3">
                        {getIntegrationIcon(d.integration.type)}
                        <span className="text-xs text-slate-700 font-bold">
                          {displayType} <span className="font-normal text-slate-500">({d.integration.name})</span>
                        </span>
                      </div>
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    </div>
                  );
                })}
                {workflow.destinations.length === 0 && <p className="text-sm text-slate-500 italic">No destinations configured.</p>}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Recent Execution Logs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <History size={20} className="text-slate-500" />
            <span>Recent Execution Logs</span>
          </h2>
          <Link href={`/workflows/${workflow.id}/runs`} className="text-sm font-bold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 transition-colors">
            <span>View All Logs</span>
            <ChevronRightIcon size={16} />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          {/* Desktop/Tablet Table */}
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50">
                <th className="px-6 py-4">Run ID</th>
                <th className="px-6 py-4">Date / Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workflow.runs.map(run => {
                const shortId = `#${run.id.substring(run.id.length - 4)}`;
                const isSuccess = run.status === 'SUCCESS';
                const isFailed = run.status === 'FAILED';

                return (
                  <tr key={run.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{shortId}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(run.createdAt))}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium">{formatDuration(run.durationMs)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-widest flex items-center w-fit border uppercase ${
                        isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        isFailed ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {isSuccess && <CheckCircle2 size={12} className="mr-1.5" />}
                        {isFailed && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>}
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/workflows/${workflow.id}/runs/${run.id}`} className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
                        View Report
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {workflow.runs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card List */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {workflow.runs.map(run => {
              const shortId = `#${run.id.substring(run.id.length - 4)}`;
              const isSuccess = run.status === 'SUCCESS';
              const isFailed = run.status === 'FAILED';

              return (
                <div key={run.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">{shortId}</span>
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-widest flex items-center border uppercase ${
                      isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      isFailed ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                    <div>
                      <p>Time: {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(run.createdAt))}</p>
                      <p className="mt-0.5">Duration: {formatDuration(run.durationMs)}</p>
                    </div>
                    <Link href={`/workflows/${workflow.id}/runs/${run.id}`} className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                      View Report
                    </Link>
                  </div>
                </div>
              );
            })}
            {workflow.runs.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                No runs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
