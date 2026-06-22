import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting to clean up previous logs from the database...");

  try {
    // 1. Delete all Workflow Runs (this will CASCADE and delete all related BlogPosts and SocialPosts)
    const runsDeleted = await prisma.workflowRun.deleteMany({});
    console.log(`✅ Deleted ${runsDeleted.count} workflow runs (and associated posts).`);

    // 2. Delete all Notifications
    const notificationsDeleted = await prisma.notification.deleteMany({});
    console.log(`✅ Deleted ${notificationsDeleted.count} notifications.`);

    // 3. Delete all RssItems that have already been processed
    const rssItemsDeleted = await prisma.rssItem.deleteMany({
      where: { processed: true }
    });
    console.log(`✅ Deleted ${rssItemsDeleted.count} processed RSS items.`);

    console.log("Cleanup complete!");
  } catch (error) {
    console.error("Error during cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
