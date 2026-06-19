import { prisma } from "@/lib/db/client";
import NewWorkflowForm from "./NewWorkflowForm";

export default async function NewWorkflowPage() {
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
      <NewWorkflowForm integrations={integrations} aiProviders={aiProviders} />
    </div>
  );
}
