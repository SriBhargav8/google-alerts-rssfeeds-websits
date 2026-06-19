import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { maskIntegrationCredentials, mergeIntegrationCredentials } from "@/lib/crypto/api-keys";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: params.id },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const credentialsObj = integration.credentials ? JSON.parse(integration.credentials) : {};
    return NextResponse.json({
      ...integration,
      credentials: maskIntegrationCredentials(credentialsObj),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const integrationId = params.id;
    const data = await req.json();
    const { name, credentials } = data;

    if (!name || !credentials) {
      return NextResponse.json({ error: "Missing name or credentials" }, { status: 400 });
    }

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const existingCredentialsObj = integration.credentials ? JSON.parse(integration.credentials) : {};
    const mergedCredentials = mergeIntegrationCredentials(credentials, existingCredentialsObj);

    const updated = await prisma.integration.update({
      where: { id: integrationId },
      data: {
        name,
        credentials: JSON.stringify(mergedCredentials),
      },
    });

    return NextResponse.json({ success: true, integration: {
      ...updated,
      credentials: maskIntegrationCredentials(mergedCredentials),
    }});
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const integrationId = params.id;

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    await prisma.integration.delete({
      where: { id: integrationId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
