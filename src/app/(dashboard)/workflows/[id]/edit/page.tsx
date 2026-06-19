import { prisma } from "@/lib/db/client";
import { notFound } from "next/navigation";
import EditWorkflowForm from "./EditWorkflowForm";

export default async function EditWorkflowPage({ params }: { params: { id: string } }) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: params.id },
    include: {
      feeds: true,
      destinations: true,
    },
  });

  if (!workflow) {
    notFound();
  }

  const rawIntegrations = await prisma.integration.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      credentials: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const integrations = rawIntegrations.map(int => {
    let categoryMappings = [];
    try {
      const creds = JSON.parse(int.credentials);
      if (creds.categoryMappings) categoryMappings = creds.categoryMappings;
    } catch(e) {}
    return {
      id: int.id,
      name: int.name,
      type: int.type,
      categoryMappings
    };
  });

  const aiSettings = await prisma.appSettings.findUnique({ where: { key: "ai_providers" } });
  let aiProviders = [];
  try {
    if (aiSettings?.value) {
      const rawProviders = JSON.parse(aiSettings.value);
      aiProviders = rawProviders.map((p: any) => ({
        id: p.id,
        type: p.type,
        modelName: p.modelName,
        isDefault: p.isDefault
      }));
    }
  } catch (e) {}

  return (
    <div className="pb-10">
      <EditWorkflowForm workflow={workflow} integrations={integrations} aiProviders={aiProviders} />
    </div>
  );
}
