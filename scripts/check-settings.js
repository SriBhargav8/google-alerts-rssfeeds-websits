const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.appSettings.findMany();
  console.log("=== App Settings ===");
  for (const s of settings) {
    console.log(`Key: ${s.key}`);
    console.log(`Value: ${s.value}`);
    console.log("-------------------");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
