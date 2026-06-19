import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const rawPassword = process.env.ADMIN_PASSWORD;
  let passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!email || (!rawPassword && !passwordHash)) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables. Cannot seed user.");
    process.exit(1);
  }

  // If a raw password was provided, hash it automatically!
  if (rawPassword) {
    console.log("Found ADMIN_PASSWORD, automatically hashing it securely...");
    passwordHash = await bcrypt.hash(rawPassword, 10);
  } else if (passwordHash && !passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
    // Fallback just in case they put raw text into the HASH variable
    console.log("Hashing the provided password...");
    passwordHash = await bcrypt.hash(passwordHash, 10);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: passwordHash as string },
    create: { email, passwordHash: passwordHash as string },
  });

  console.log(`User seeded successfully with email: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
