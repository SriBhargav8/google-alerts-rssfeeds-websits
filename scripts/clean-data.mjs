import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Cleaning database...\n");

  const social   = await prisma.socialPost.deleteMany();
  const blogs    = await prisma.blogPost.deleteMany();
  const runs     = await prisma.workflowRun.deleteMany();
  const rss      = await prisma.rssItem.deleteMany();
  const notifs   = await prisma.notification.deleteMany();

  console.log(`✅ Deleted ${social.count}  social posts`);
  console.log(`✅ Deleted ${blogs.count}   blog posts`);
  console.log(`✅ Deleted ${runs.count}    workflow runs`);
  console.log(`✅ Deleted ${rss.count}     RSS items`);
  console.log(`✅ Deleted ${notifs.count}  notifications`);
  console.log("\n✨ Database cleaned — fresh start!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
