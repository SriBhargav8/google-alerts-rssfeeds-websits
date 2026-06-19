import { prisma } from "@/lib/db/client";
import { Workflow, Code, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import CostBlockWarning from "@/components/CostBlockWarning";

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const activeWorkflows = await prisma.workflow.count({ where: { isActive: true } });
  const totalItemsProcessed = await prisma.rssItem.count({ where: { processed: true } });
  const totalPostsGenerated = await prisma.blogPost.count();
  
  const totalRuns = await prisma.workflowRun.count();
  const successfulRuns = await prisma.workflowRun.count({ where: { status: "SUCCESS" } });
  const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) : "0.0";

  const latestRuns = await prisma.workflowRun.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { workflow: true },
  });

  const allSettings = await prisma.appSettings.findMany();
  const settingsMap = allSettings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  const spent = parseFloat(settingsMap["ai_spent_usd"] || "0");
  const limit = parseFloat(settingsMap["ai_cost_limit"] || "10.0");
  const blocked = settingsMap["ai_blocked"] === "true";
  const override = settingsMap["ai_override"] === "true";

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between md:items-start space-y-4 md:space-y-0 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">System Overview</h1>
          <p className="text-slate-500 mt-2">Real-time metrics for AI orchestration workflows.</p>
        </div>
        <Link 
          href="/workflows/new" 
          className="flex items-center space-x-2 bg-[#4F4DF8] hover:bg-[#605eff] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
        >
          <Workflow size={16} />
          <span>Create Workflow</span>
        </Link>
      </header>

      <CostBlockWarning spent={spent} limit={limit} blocked={blocked} override={override} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col justify-between h-40 transition-all hover:shadow-md dark:bg-blue-950/20 dark:border-blue-900/30">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-blue-600/80 dark:text-blue-400/90 uppercase tracking-wider">Active Workflows</p>
            <div className="p-2.5 bg-blue-100/60 dark:bg-blue-950/80 border border-transparent dark:border-blue-800/50 rounded-xl shadow-sm">
              <Workflow size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-blue-900 dark:text-blue-200">{activeWorkflows}</h3>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center mt-2">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Stable
            </p>
          </div>
        </div>
        
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 shadow-sm flex flex-col justify-between h-40 transition-all hover:shadow-md dark:bg-indigo-950/20 dark:border-indigo-900/30">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-indigo-600/80 dark:text-indigo-400/90 uppercase tracking-wider">Items Processed</p>
            <div className="p-2.5 bg-indigo-100/60 dark:bg-indigo-950/80 border border-transparent dark:border-indigo-800/50 rounded-xl shadow-sm">
              <Code size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-indigo-900 dark:text-indigo-200">{totalItemsProcessed.toLocaleString()}</h3>
            <p className="text-sm font-semibold text-indigo-600/80 dark:text-indigo-400/80 mt-2">All time total</p>
          </div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 shadow-sm flex flex-col justify-between h-40 transition-all hover:shadow-md dark:bg-emerald-950/20 dark:border-emerald-900/30">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-emerald-600/80 dark:text-emerald-400/90 uppercase tracking-wider">Posts Published</p>
            <div className="p-2.5 bg-emerald-100/60 dark:bg-emerald-950/80 border border-transparent dark:border-emerald-800/50 rounded-xl shadow-sm">
              <Send size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-emerald-900 dark:text-emerald-200">{totalPostsGenerated.toLocaleString()}</h3>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center mt-2">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Growing
            </p>
          </div>
        </div>

        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-6 shadow-sm flex flex-col justify-between h-40 transition-all hover:shadow-md dark:bg-amber-950/20 dark:border-amber-900/30">
          <div className="flex justify-between items-start">
            <p className="text-xs font-bold text-amber-600/80 dark:text-amber-400/90 uppercase tracking-wider">Success Rate</p>
            <div className="p-2.5 bg-amber-100/60 dark:bg-amber-950/80 border border-transparent dark:border-amber-800/50 rounded-xl shadow-sm">
              <CheckCircle2 size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-extrabold text-amber-900 dark:text-amber-200">{successRate}%</h3>
            <p className="text-sm font-semibold text-amber-600/80 dark:text-amber-400/80 mt-2">Lifetime reliability</p>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-slate-900">Recent Workflow Activity</h2>
          <Link href="/workflows" className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors">View All</Link>
        </div>
        
        <div className="overflow-x-auto">
          {/* Desktop/Tablet Table */}
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Workflow Name</th>
                <th className="px-6 py-4 font-bold">Run Time</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestRuns.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{run.workflow.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {run.workflowId.substring(0, 10)}...</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(run.createdAt))}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Duration: {run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : 'Unknown'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center border ${
                        run.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        run.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                          run.status === 'SUCCESS' ? 'bg-emerald-500' : 
                          run.status === 'FAILED' ? 'bg-red-500' : 
                          'bg-blue-500 animate-pulse'
                        }`}></span>
                        {run.status.charAt(0).toUpperCase() + run.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/workflows/${run.workflowId}/runs/${run.id}`} 
                      className="text-sm font-bold text-indigo-600 hover:text-indigo-900 hover:underline"
                    >
                      View Log
                    </Link>
                  </td>
                </tr>
              ))}
              {latestRuns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No workflow runs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile Card List */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {latestRuns.map((run) => (
              <div key={run.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{run.workflow.name}</p>
                    <p className="text-[10px] text-slate-500 mt-1">ID: {run.workflowId.substring(0, 10)}...</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider flex items-center border shrink-0 ${
                    run.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                    run.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' : 
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {run.status.charAt(0).toUpperCase() + run.status.slice(1).toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <div>
                    <p>Run: {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(run.createdAt))}</p>
                    <p className="mt-0.5">Duration: {run.durationMs ? `${Math.round(run.durationMs / 1000)}s` : 'Unknown'}</p>
                  </div>
                  <Link 
                    href={`/workflows/${run.workflowId}/runs/${run.id}`} 
                    className="text-xs font-bold text-[#4F4DF8] hover:text-[#605eff] bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-lg"
                  >
                    View Log
                  </Link>
                </div>
              </div>
            ))}
            {latestRuns.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm font-medium">
                No workflow runs recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
