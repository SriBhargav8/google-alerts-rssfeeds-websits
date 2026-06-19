import { prisma } from "@/lib/db/client";
import SettingsForm from "./SettingsForm";
import { maskApiKey, AiProviderConfig } from "@/lib/crypto/api-keys";

export default async function SettingsPage() {
  const allSettings = await prisma.appSettings.findMany();
  const settingsMap = allSettings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);

  if (settingsMap["ai_providers"]) {
    try {
      const providers: AiProviderConfig[] = JSON.parse(settingsMap["ai_providers"]);
      const maskedProviders = providers.map(p => ({
        ...p,
        apiKey: p.apiKey ? maskApiKey(p.apiKey) : ""
      }));
      settingsMap["ai_providers"] = JSON.stringify(maskedProviders);
    } catch (e) {
      console.error("Failed to parse and mask AI providers:", e);
    }
  }

  return (
    <SettingsForm initialSettings={settingsMap} />
  );
}
