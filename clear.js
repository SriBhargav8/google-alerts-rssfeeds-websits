const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.workflowRun.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rssItem.updateMany({data: {processed: false}});
  console.log('Logs and notifications cleared!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
