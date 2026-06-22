import { prisma } from "@/lib/db/client";
import { Play, Plus, Search, ChevronLeft, ChevronRight, Filter, AlignLeft, LayoutGrid, FileText, RefreshCw, Archive, Eye } from "lucide-react";
import Link from "next/link";
import WorkflowToggle from "./WorkflowToggle";
import RunWorkflowButton from "./[id]/RunWorkflowButton";

export const dynamic = 'force-dynamic';

function formatCron(cron: string) {
  if (cron === "*/15 * * * *") return "Every 15m";
  if (cron === "*/30 * * * *") return "Every 30m";
  if (cron === "0 * * * *") return "Hourly";
  if (cron === "0 0 * * *") return "Daily at Midnight";
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

export default async function WorkflowsPage({ searchParams }: { searchParams: { q?: string; page?: string; sort?: string } }) {
  const query = searchParams.q || "";
  const page = parseInt(searchParams.page || "1", 10);
  const sort = searchParams.sort || "createdAt";
  const limit = 6;
  const skip = (page - 1) * limit;

  const whereClause = query ? { name: { contains: query } } : {};
  
  let orderBy: any = { createdAt: "desc" };
  if (sort === "status") orderBy = { isActive: "desc" };
  if (sort === "last_run") orderBy = { updatedAt: "desc" };
  
  const workflows = await prisma.workflow.findMany({
    where: whereClause,
    include: {
      feeds: true,
      destinations: { include: { integration: true } },
      runs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: orderBy,
    skip,
    take: limit,
  });

  const totalFiltered = await prisma.workflow.count({ where: whereClause });
  const totalPages = Math.ceil(totalFiltered / limit);

  const formatLastRun = (dateStr?: Date | null) => {
    if (!dateStr) return "Never run";
    const d = new Date(dateStr);
    
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between md:items-start space-y-4 md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-2">
            <LayoutGrid size={24} className="text-indigo-600" />
            <span>Active Workflows</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Manage and monitor your automated orchestration pipelines.</p>
        </div>
        <Link 
          href="/workflows/new"
          className="flex items-center space-x-2 bg-[#4F4DF8] hover:bg-[#605eff] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={16} />
          <span>New Workflow</span>
        </Link>
      </header>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:flex-1 flex items-center gap-3">
          <form className="relative flex-1 max-w-2xl" method="GET" action="/workflows">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" name="q" defaultValue={query} placeholder="Filter workflows..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-700 transition-all"
            />
          </form>
          {query && (
            <Link href="/workflows" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-2 whitespace-nowrap">
              Clear Filter
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 pl-0 md:pl-4 md:border-l">
          <Link href={`/workflows?sort=status${query ? `&q=${query}` : ""}`} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-1.5 text-sm font-bold transition-colors ${sort === 'status' ? 'text-indigo-600 bg-indigo-50 rounded-md' : 'text-slate-600 hover:text-slate-900'}`}>
            <Filter size={16} className={sort === 'status' ? 'text-indigo-500' : 'text-slate-400'} />
            <span>Status</span>
          </Link>
          <Link href={`/workflows?sort=last_run${query ? `&q=${query}` : ""}`} className={`flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-1.5 text-sm font-bold transition-colors ${sort === 'last_run' ? 'text-indigo-600 bg-indigo-50 rounded-md' : 'text-slate-600 hover:text-slate-900'}`}>
            <AlignLeft size={16} className={sort === 'last_run' ? 'text-indigo-500' : 'text-slate-400'} />
            <span>Last Run</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {workflows.map((wf, index) => {
          const isPaused = !wf.isActive;
          // Determine icon visually based on name or index
          let Icon = FileText;
          let iconBg = "bg-indigo-100";
          let iconColor = "text-indigo-600";
          
          if (wf.name.toLowerCase().includes("sync") || wf.name.toLowerCase().includes("crm")) {
            Icon = RefreshCw;
            iconBg = "bg-purple-100";
            iconColor = "text-purple-600";
          } else if (wf.name.toLowerCase().includes("backup")) {
            Icon = Archive;
            iconBg = "bg-slate-100";
            iconColor = "text-slate-600";
          } else if (index % 2 === 1) {
            Icon = RefreshCw;
            iconBg = "bg-purple-100";
            iconColor = "text-purple-600";
          }

          if (isPaused) {
            iconBg = "bg-slate-100";
            iconColor = "text-slate-400";
          }

          return (
            <div key={wf.id} className={`bg-white border rounded-xl p-6 flex flex-col justify-between transition-shadow hover:shadow-md ${isPaused ? 'border-slate-200/60 opacity-80' : 'border-slate-200'}`}>
              
              {/* Card Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon size={24} className={iconColor} />
                  </div>
                  <div>
                    <Link href={`/workflows/${wf.id}`} className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors block">
                      {wf.name}
                    </Link>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {wf.feeds.length > 0 ? `Aggregates ${wf.feeds.length} RSS feeds to ${wf.destinations.length} destination${wf.destinations.length !== 1 ? 's' : ''}.` : "Automated content pipeline."}
                    </p>
                  </div>
                </div>
                <div>
                  <WorkflowToggle id={wf.id} initialActive={wf.isActive} />
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-t border-slate-100 pt-5 mt-auto">
                <div className="flex space-x-4 sm:space-x-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">SCHEDULE</p>
                    <p className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 w-fit" title={`Raw CRON: ${wf.cronSchedule}`}>
                      {formatCron(wf.cronSchedule)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">LAST RUN</p>
                    <p className="text-xs font-bold text-slate-700">
                      {wf.runs.length > 0 ? formatLastRun(wf.runs[0].createdAt) : 'Never run'}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2 justify-end">
                  <Link 
                    href={`/workflows/${wf.id}`} 
                    className="p-2 border border-slate-200 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="View Workflow"
                  >
                    <Eye size={16} />
                  </Link>
                  <RunWorkflowButton workflowId={wf.id} variant="secondary" />
                </div>
              </div>

            </div>
          );
        })}

        {workflows.length === 0 && (
          <div className="col-span-1 lg:col-span-2 text-center py-20 bg-white border border-slate-200 border-dashed rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-4 text-slate-400">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No workflows found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filter or create a new workflow.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 pt-4">
          <Link href={`/workflows?page=${Math.max(1, page - 1)}${query ? `&q=${query}` : ""}`} className={`p-2 rounded-lg border ${page === 1 ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}><ChevronLeft size={20} /></Link>
          <span className="text-sm font-medium text-slate-600">Page {page} of {totalPages}</span>
          <Link href={`/workflows?page=${Math.min(totalPages, page + 1)}${query ? `&q=${query}` : ""}`} className={`p-2 rounded-lg border ${page === totalPages ? 'border-slate-200 text-slate-300 pointer-events-none' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}><ChevronRight size={20} /></Link>
        </div>
      )}
    </div>
  );
}
