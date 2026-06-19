import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Activity, CheckCircle2, XCircle, ChevronRight, History } from "lucide-react";

export default async function WorkflowRunsPage({ params }: { params: { id: string } }) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      runs: {
        orderBy: { createdAt: "desc" },
        take: 50
      }
    }
  });

  if (!workflow) notFound();

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-4">
        <Link href="/workflows" className="hover:text-slate-900 transition-colors">Workflows</Link>
        <ChevronRight size={14} />
        <Link href={`/workflows/${workflow.id}`} className="hover:text-slate-900 transition-colors truncate max-w-[200px]">{workflow.name}</Link>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-bold">Execution Logs</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center space-x-3">
            <History size={28} className="text-indigo-600" />
            <span>Execution Logs</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">History of all automated runs for <span className="font-bold text-slate-700">{workflow.name}</span>.</p>
        </div>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Run Date</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {workflow.runs.map((run) => {
              const durationStr = run.completedAt 
                ? `${Math.round((new Date(run.completedAt).getTime() - new Date(run.createdAt).getTime()) / 1000)}s` 
                : "In Progress";
                
              return (
                <tr key={run.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 text-sm text-slate-900 font-medium">
                      <Clock size={16} className="text-slate-400" />
                      <span>{new Date(run.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-widest flex items-center w-fit border uppercase ${
                      run.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      run.status === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' : 
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {run.status === 'SUCCESS' && <CheckCircle2 size={12} className="mr-1.5" />}
                      {run.status === 'FAILED' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>}
                      {run.status === 'PENDING' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5"></span>}
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                    {durationStr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/workflows/${workflow.id}/runs/${run.id}`} className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
                      View Full Report
                    </Link>
                  </td>
                </tr>
              );
            })}
            {workflow.runs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                  This workflow has not been executed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
