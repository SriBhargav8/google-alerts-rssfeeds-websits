import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession, hasRole } from "@/lib/auth/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession(req);
    if (!hasRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id } = params;
    
    // Prevent deleting yourself
    if (session?.userId === id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getSession(req);
    if (!hasRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { id } = params;
    const { role, name } = await req.json();

    // Prevent changing your own role
    if (session?.userId === id && role && role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot demote yourself." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role ? { role } : {}),
        ...(name ? { name } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
