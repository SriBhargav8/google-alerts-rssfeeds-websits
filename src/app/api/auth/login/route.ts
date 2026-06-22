import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/client";
import { signToken } from "@/lib/auth/jwt";

const rateLimitMap = new Map<string, { count: number, lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    
    // Check rate limit
    const record = rateLimitMap.get(ip);
    if (record) {
      if (now - record.lastAttempt < LOCKOUT_TIME_MS && record.count >= MAX_ATTEMPTS) {
        const remainingMinutes = Math.ceil((LOCKOUT_TIME_MS - (now - record.lastAttempt)) / 60000);
        return NextResponse.json({ error: `Too many login attempts. Please try again in ${remainingMinutes} minutes.` }, { status: 429 });
      }
      
      // Reset count if lockout time has passed
      if (now - record.lastAttempt >= LOCKOUT_TIME_MS) {
        rateLimitMap.delete(ip);
      }
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      recordFailedAttempt(ip, now);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      recordFailedAttempt(ip, now);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Clear rate limit on successful login
    rateLimitMap.delete(ip);

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ success: true, message: "Logged in successfully" });
    
    const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

    // Set cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function recordFailedAttempt(ip: string, now: number) {
  const record = rateLimitMap.get(ip) || { count: 0, lastAttempt: now };
  record.count += 1;
  record.lastAttempt = now;
  rateLimitMap.set(ip, record);
}
