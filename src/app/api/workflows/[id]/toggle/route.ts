import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: { isActive: data.isActive },
    });
    return NextResponse.json({ success: true, workflow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
