const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runId = 'cmqj8b86f00015hdjy3cte7m8';
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      blogPosts: true
    }
  });
  
  if (!run) {
    console.log("Run not found.");
    return;
  }
  
  console.log("--- RUN STATUS ---");
  console.log(run.status);
  console.log("--- ERROR LOG ---");
  console.log(run.errorLog);
  console.log("--- FULL LOGS ---");
  try {
    const parsedLogs = JSON.parse(run.logs);
    console.log(JSON.stringify(parsedLogs, null, 2));
  } catch (e) {
    console.log(run.logs);
  }
  
  console.log("\n--- GENERATED BLOG POSTS ---");
  for (const post of run.blogPosts) {
    console.log(`\nPost ID: ${post.id}`);
    console.log(`Title: ${post.title}`);
    console.log(`Summary: ${post.summary}`);
    console.log(`Content length: ${post.content?.length}`);
    console.log(`Source URL: ${post.sourceUrl}`);
    console.log(`Payload CMS ID: ${post.cmsPostId}`);
    console.log(`Status: ${post.status}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
