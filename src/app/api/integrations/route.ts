import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, type, credentials } = data;

    if (!name || !type || !credentials) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const integration = await prisma.integration.create({
      data: {
        name,
        type,
        credentials: JSON.stringify(credentials),
      },
    });

    return NextResponse.json({ success: true, integration });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
