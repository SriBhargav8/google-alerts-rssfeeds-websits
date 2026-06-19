import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { Search, Calendar, Filter, Clock, User, Webhook, ChevronRight, ChevronLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function LogsPage({ searchParams }: { searchParams: { query?: string, page?: string, status?: string } }) {
  const query = searchParams?.query || "";
  const status = searchParams?.status || "";
  const page = parseInt(searchParams?.page || "1", 10) || 1;
  const pageSize = 10;

  // Build where clause
  const where: any = {};
  
  if (query) {
    where.OR = [
      { id: { contains: query } },
      { workflow: { name: { contains: query } } }
    ];
  }
  
  if (status && status !== "") {
    where.status = status;
  }

  const [totalCount, runs] = await Promise.all([
    prisma.workflowRun.count({ where }),
    prisma.workflowRun.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { workflow: true }
    })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getTriggerDetails = (run: any) => {
    if (run.workflow?.cronSchedule) {
      return { type: "Scheduled", icon: <Clock size={16} /> };
    }
    return { type: "Manual", icon: <User size={16} /> };
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "--";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const createPageUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (status) params.set("status", status);
    if (newPage > 1) params.set("page", newPage.toString());
    const str = params.toString();
    return `/logs${str ? `?${str}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Run Logs</h1>
        <p className="text-slate-500 mt-2">A complete historical record of all automated and manual executions.</p>
      </header>

      {/* Filter / Search Bar */}
      <form method="GET" action="/logs" className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            name="query"
            defaultValue={query}
            placeholder="Search Run ID or Workflow Name..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Status</span>
            <select name="status" defaultValue={status} className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer">
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <button type="submit" className="flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded-md text-sm font-bold transition-colors shadow-sm">
            <Filter size={16} />
            <span>Apply</span>
          </button>
          {(query || status) && (
            <Link href="/logs" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-2">Clear</Link>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <th className="px-6 py-4">Run ID</th>
                <th className="px-6 py-4">Workflow Name</th>
                <th className="px-6 py-4">Trigger</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((run) => {
                const trigger = getTriggerDetails(run);
                const isSuccess = run.status === 'SUCCESS';
                const isFailed = run.status === 'FAILED';
                const shortId = `#${run.id.substring(run.id.length - 4)}`;
                
                return (
                  <tr key={run.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-500">{shortId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{run.workflow.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate-600 text-sm font-medium">
                        {trigger.icon}
                        <span>{trigger.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-900">
                        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(run.createdAt))}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(run.createdAt))}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 font-medium">
                        {formatDuration(run.durationMs)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-widest flex items-center border uppercase ${
                          isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          isFailed ? 'bg-red-50 text-red-700 border-red-200' : 
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isSuccess ? 'bg-emerald-500' : 
                            isFailed ? 'bg-red-500' : 
                            'bg-blue-500 animate-pulse'
                          }`}></span>
                          {run.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/workflows/${run.workflowId}/runs/${run.id}`} 
                        className="inline-flex items-center space-x-1 text-sm font-bold text-indigo-600 hover:text-indigo-900 transition-colors"
                      >
                        <span>View Report</span>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              
              {runs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No run logs found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 text-sm gap-4">
            <span className="text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, totalCount)}</span> of <span className="text-slate-900 font-bold">{totalCount}</span> entries
            </span>
            <div className="flex space-x-2">
              {page > 1 ? (
                <Link href={createPageUrl(page - 1)} className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-md text-slate-700 font-medium transition-colors">
                  <ChevronLeft size={16} />
                </Link>
              ) : (
                <button disabled className="px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-slate-300 cursor-not-allowed">
                  <ChevronLeft size={16} />
                </button>
              )}
              
              <div className="flex items-center px-2 font-bold text-slate-700">
                Page {page} of {totalPages}
              </div>

              {page < totalPages ? (
                <Link href={createPageUrl(page + 1)} className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-md text-slate-700 font-medium transition-colors">
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <button disabled className="px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-slate-300 cursor-not-allowed">
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
