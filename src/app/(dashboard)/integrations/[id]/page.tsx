import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import EditIntegrationForm from "./EditIntegrationForm";

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

  return (
    <EditIntegrationForm integration={integration} />
  );
}
