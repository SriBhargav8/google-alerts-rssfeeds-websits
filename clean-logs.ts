import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning logs and RSS data...");
  
  await prisma.notification.deleteMany();
  console.log("Deleted Notifications");

  await prisma.socialPost.deleteMany();
  console.log("Deleted SocialPosts");

  await prisma.blogPost.deleteMany();
  console.log("Deleted BlogPosts");

  await prisma.workflowRun.deleteMany();
  console.log("Deleted WorkflowRuns (Logs)");

  await prisma.rssItem.deleteMany();
  console.log("Deleted RssItems");

  console.log("Clean up complete!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
