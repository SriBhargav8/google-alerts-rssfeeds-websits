import { prisma } from "@/lib/db/client";
import UsersClient from "./UsersClient";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/jwt";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const token = cookies().get("auth_token")?.value;
  let currentUserId = null;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded && typeof decoded === 'object') {
      currentUserId = (decoded as any).userId;
    }
  }

  const dbUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <UsersClient users={dbUsers} currentUserId={currentUserId} />;
}
