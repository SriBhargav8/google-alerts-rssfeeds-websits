import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, RefreshCw, ExternalLink, CheckCircle2, XCircle, Code, Clock, Globe, MessageSquare, Briefcase, FileText } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function RunDetailsPage({ params }: { params: { id: string; runId: string } }) {
  const run = await prisma.workflowRun.findUnique({
    where: { id: params.runId },
    include: {
      workflow: true,
      blogPosts: { include: { socialPosts: true } },
    }
  });

  if (!run) notFound();

  // Parse logs if they exist
  let executionLogs = [];
  try {
    if (run.logs) executionLogs = JSON.parse(run.logs);
  } catch (e) {
    // leave empty
  }

  const isSuccess = run.status === 'SUCCESS';
  const isFailed = run.status === 'FAILED';
  const shortId = run.id.substring(run.id.length - 4);
  
  const formatDuration = (ms: number | null) => {
    if (!ms) return "--";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const timeAgo = (date: Date) => {
    const diff = (new Date().getTime() - new Date(date).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatCron = (cron: string | null) => {
    if (!cron) return "Manual";
    if (cron === "0 * * * *") return "Hourly";
    if (cron === "0 0 * * *") return "Daily at Midnight";
    if (cron === "0 8 * * *") return "Daily at 8:00 AM";
    if (cron === "0 0 * * 0") return "Weekly on Sunday";
    if (cron === "0 0 1 * *") return "Monthly on the 1st";
    
    const dailyMatch = cron.match(/^0 (\d+) \* \* \*$/);
    if (dailyMatch) {
      const hour = parseInt(dailyMatch[1], 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `Daily at ${hour12}:00 ${ampm}`;
    }
    
    return `Scheduled (${cron})`;
  };

  const posts = run.blogPosts;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {run.status === 'PENDING' && <meta httpEquiv="refresh" content="2" />}
      
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500 font-medium mb-2">
        <Link href="/workflows" className="hover:text-slate-900 transition-colors">Workflows</Link>
        <ChevronRight size={14} />
        <Link href={`/workflows/${run.workflowId}`} className="hover:text-slate-900 transition-colors truncate max-w-[200px]">{run.workflow.name}</Link>
        <ChevronRight size={14} />
        <span className="text-slate-900 font-bold">Run #{shortId}</span>
      </nav>

      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Run #{shortId}</h1>
            <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-bold tracking-widest flex items-center border uppercase ${
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
          <p className="text-slate-500 mt-2 font-medium flex items-center space-x-2 text-sm">
            <Clock size={16} className="text-slate-400" />
            <span>Started {timeAgo(run.createdAt)}</span>
            <span>•</span>
            <span>Duration: {formatDuration(run.durationMs)}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {posts.length > 0 && posts[0].cmsUrl && (
            <a href={posts[0].cmsUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
              <ExternalLink size={16} />
              <span>View Live Post</span>
            </a>
          )}
        </div>
      </header>

      {run.errorLog && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-red-800 font-bold flex items-center space-x-2"><XCircle size={18} /><span>Error Details</span></h2>
          <pre className="mt-3 text-xs text-red-700 whitespace-pre-wrap font-mono bg-red-100/50 p-4 rounded-lg border border-red-200">
            {run.errorLog}
          </pre>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Execution Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900">Execution Timeline</h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono border border-slate-200">ID: r_{run.id.substring(0,8)}</span>
            </div>
            <div className="p-5">
              {executionLogs.length > 0 ? (
                <div className="space-y-0">
                  {executionLogs.map((log: any, i: number) => {
                    const isLast = i === executionLogs.length - 1;
                    const isError = log.level === 'error' || log.step.toLowerCase().includes('error');

                    return (
                      <div key={i} className="flex space-x-4">
                        <div className="flex flex-col items-center">
                          {isError ? (
                            <XCircle size={20} className="text-red-500 bg-white" />
                          ) : (
                            <CheckCircle2 size={20} className="text-emerald-500 bg-white" />
                          )}
                          {!isLast && <div className={`w-px h-full my-1 ${isError ? 'bg-red-200' : 'bg-emerald-200'}`} />}
                        </div>
                        <div className="flex-1 pb-6 pt-0.5">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm font-bold ${isError ? 'text-red-700' : 'text-slate-900'}`}>{log.step}</p>
                          </div>
                          <p className={`text-xs mt-1 mb-2 ${isError ? 'text-red-600' : 'text-slate-500'}`}>{log.message}</p>
                          {log.data && (
                            <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.data, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-slate-500 text-sm italic">No timeline events recorded.</p>
                </div>
              )}
            </div>
          </div>

          {/* RUN METADATA */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">RUN METADATA</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Trigger</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatCron(run.workflow.cronSchedule)}
                </p>
              </div>
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">Workflow ID</p>
                <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-md font-mono text-xs text-slate-700">
                  wf_{run.workflowId.substring(0, 8)}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {posts.length > 0 ? (
            <div className="space-y-12">
              {posts.map((post) => (
                <div key={post.id} className="space-y-6">
                  {/* Generated Content Preview */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
                      <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
                        <FileText size={16} className="text-slate-500" />
                        <span>Generated Content Preview</span>
                      </div>
                      <div className="flex space-x-2 text-slate-400">
                        <Code size={16} className="cursor-pointer hover:text-slate-600" />
                      </div>
                    </div>
                    
                    <div className="p-8">
                      {post.imagePath && (
                        <div className="mb-8 rounded-lg overflow-hidden border border-slate-200 aspect-[21/9] bg-slate-900 relative">
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                            <span className="font-mono text-sm tracking-widest">AUTOFEED IMAGE ENGINE</span>
                            <span className="text-xs mt-2">{post.imagePath}</span>
                          </div>
                        </div>
                      )}

                      <h3 className="text-3xl font-extrabold text-slate-900 mb-4 leading-tight">{post.title}</h3>
                      
                      {post.summary && (
                        <p className="text-lg text-slate-600 mb-6 italic border-l-4 border-slate-200 pl-4">{post.summary}</p>
                      )}
                      
                      <div className="flex items-center space-x-3 text-xs text-slate-500 font-medium mb-8 pb-4 border-b border-slate-100">
                        <span>Published: {new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(post.createdAt))}</span>
                        <span>•</span>
                        <span>Author: AutoFeed Bot</span>
                      </div>

                      <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Cards Row */}
                  {post.socialPosts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {post.socialPosts.map(social => {
                        const isWp = social.platform === 'wordpress';
                        const isTwitter = social.platform === 'twitter';
                        const isLinkedIn = social.platform === 'linkedin';
                        
                        let title = social.platform;
                        let icon = <Globe size={18} className="text-blue-600" />;
                        let stateText = "Published";

                        if (isWp) { title = "WordPress"; stateText = "Live"; }
                        if (isTwitter) { title = "X / Twitter"; icon = <span className="font-bold text-slate-900 leading-none text-lg">X</span>; stateText = "Posted"; }
                        if (isLinkedIn) { title = "LinkedIn"; icon = <Briefcase size={18} className="text-blue-700" />; stateText = "Published"; }

                        return (
                          <div key={social.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-32 relative">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center space-x-2">
                                {icon}
                                <span className="font-bold text-slate-900 text-sm">{title}</span>
                              </div>
                              {social.postUrl && (
                                <a href={social.postUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 transition-colors">
                                  <ExternalLink size={14} />
                                </a>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
                              <div className="flex items-center space-x-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${social.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                <span className={`text-xs font-bold ${social.status === 'SUCCESS' ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {social.status === 'SUCCESS' ? stateText : 'Failed'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-500">
              <p>No content was generated during this run.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
