import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession, hasRole } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    // Ensure only ADMIN can perform this action
    if (!hasRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized. Admin access required to clear logs." }, { status: 403 });
    }

    let workflowId = null;
    let runId = null;

    try {
      const body = await req.json();
      workflowId = body.workflowId;
      runId = body.runId;
    } catch(e) {} // Ignore if no body

    let runsDeleted = { count: 0 };
    let notificationsDeleted = { count: 0 };
    let rssItemsDeleted = { count: 0 };

    if (runId) {
      // Clear specific run
      runsDeleted = await prisma.workflowRun.deleteMany({ where: { id: runId } });
      notificationsDeleted = await prisma.notification.deleteMany({ where: { runId: runId } });
    } else if (workflowId) {
      // Clear specific workflow
      runsDeleted = await prisma.workflowRun.deleteMany({ where: { workflowId: workflowId } });
      notificationsDeleted = await prisma.notification.deleteMany({ where: { workflowId: workflowId } });
      
      const feeds = await prisma.rssFeed.findMany({ where: { workflowId: workflowId } });
      const feedIds = feeds.map(f => f.id);
      rssItemsDeleted = await prisma.rssItem.deleteMany({
        where: { feedId: { in: feedIds }, processed: true }
      });
    } else {
      // Clear all
      runsDeleted = await prisma.workflowRun.deleteMany({});
      notificationsDeleted = await prisma.notification.deleteMany({});
      rssItemsDeleted = await prisma.rssItem.deleteMany({ where: { processed: true } });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database cleanup complete",
      details: {
        runsDeleted: runsDeleted.count,
        notificationsDeleted: notificationsDeleted.count,
        processedRssItemsDeleted: rssItemsDeleted.count
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

