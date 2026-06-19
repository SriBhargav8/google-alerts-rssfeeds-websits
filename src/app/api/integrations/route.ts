import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { encryptIntegrationCredentials, maskIntegrationCredentials } from "@/lib/crypto/api-keys";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, type, credentials } = data;

    if (!name || !type || !credentials) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const encryptedCredentials = encryptIntegrationCredentials(credentials);

    const integration = await prisma.integration.create({
      data: {
        name,
        type,
        credentials: JSON.stringify(encryptedCredentials),
      },
    });

    const maskedIntegration = {
      ...integration,
      credentials: maskIntegrationCredentials(encryptedCredentials),
    };

    return NextResponse.json({ success: true, integration: maskedIntegration });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
