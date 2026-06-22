import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";

export interface Session {
  userId: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER" | string;
}

export function getSession(req: NextRequest): Session | null {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return decoded as Session;
}

export function hasRole(session: Session | null, allowedRoles: string[]): boolean {
  if (!session) return false;
  if (!session.role) return false;
  const upperRole = session.role.toUpperCase();
  return allowedRoles.some(r => r.toUpperCase() === upperRole);
}
