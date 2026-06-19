import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  let passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!email || !passwordHash) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD_HASH in environment variables. Cannot seed user.");
    process.exit(1);
  }

  // If the hash is actually just a plain string (like during quick local dev setup), hash it.
  // Real bcrypt hashes start with $2a$ or $2b$
  if (!passwordHash.startsWith('$2a$') && !passwordHash.startsWith('$2b$')) {
    console.log("ADMIN_PASSWORD_HASH doesn't look like a bcrypt hash, hashing it now...");
    passwordHash = await bcrypt.hash(passwordHash, 10);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
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
