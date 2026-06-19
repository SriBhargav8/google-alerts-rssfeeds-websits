import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);
  
  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: hash,
    },
  });

  const workflow = await prisma.workflow.create({
    data: {
      name: "Tech News Daily",
      cronSchedule: "0 8 * * *",
      feeds: {
        create: [
          { url: "https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en", label: "AI News" }
        ]
      }
    }
  });

  console.log("Seeding complete. Admin email: admin@example.com, Password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
