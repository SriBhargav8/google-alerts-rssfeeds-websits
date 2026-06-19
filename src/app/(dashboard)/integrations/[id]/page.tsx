import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import EditIntegrationForm from "./EditIntegrationForm";
import { maskIntegrationCredentials } from "@/lib/crypto/api-keys";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditIntegrationPage({ params }: PageProps) {
  const integration = await prisma.integration.findUnique({
    where: { id: params.id },
  });

  if (!integration) {
    notFound();
  }

  let maskedIntegration = { ...integration };
  try {
    const creds = integration.credentials ? JSON.parse(integration.credentials) : {};
    maskedIntegration.credentials = JSON.stringify(maskIntegrationCredentials(creds));
  } catch (e) {
    // Ignore parse error
  }

  return (
    <EditIntegrationForm integration={maskedIntegration} />
  );
}
