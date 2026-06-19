import { prisma } from "@/lib/db/client";
import IntegrationsClient from "./IntegrationsClient";

export default async function IntegrationsPage() {
  const dbIntegrations = await prisma.integration.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <IntegrationsClient integrations={dbIntegrations} />;
}
