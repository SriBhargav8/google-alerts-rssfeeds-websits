import { prisma } from "@/lib/db/client";
import IntegrationsClient from "./IntegrationsClient";
import { maskIntegrationCredentials } from "@/lib/crypto/api-keys";

export default async function IntegrationsPage() {
  const dbIntegrations = await prisma.integration.findMany({
    orderBy: { createdAt: "desc" },
  });

  const maskedIntegrations = dbIntegrations.map(int => {
    try {
      const creds = int.credentials ? JSON.parse(int.credentials) : {};
      return {
        ...int,
        credentials: JSON.stringify(maskIntegrationCredentials(creds))
      };
    } catch (e) {
      return int;
    }
  });

  return <IntegrationsClient integrations={maskedIntegrations} />;
}
