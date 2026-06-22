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

    // 1. Delete all Workflow Runs (this will CASCADE and delete all related BlogPosts and SocialPosts)
    const runsDeleted = await prisma.workflowRun.deleteMany({});

    // 2. Delete all Notifications
    const notificationsDeleted = await prisma.notification.deleteMany({});

    // 3. Delete all RssItems that have already been processed
    const rssItemsDeleted = await prisma.rssItem.deleteMany({
      where: { processed: true }
    });

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
