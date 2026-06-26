import { prisma } from "../src/lib/db/client";
import { getDecryptedKey } from "../src/lib/crypto/api-keys";

async function main() {
  const aiSettings = await prisma.appSettings.findUnique({ where: { key: "ai_providers" } });
  if (!aiSettings?.value) {
    console.log("No AI providers found in settings.");
    return;
  }
  
  const providers = JSON.parse(aiSettings.value);
  for (const p of providers) {
    if (p.type === "openrouter" && p.apiKey) {
      console.log(`Provider: ${p.name || p.type}`);
      console.log(`API Key: ${getDecryptedKey(p.apiKey)}`);
      console.log("-----------------------");
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
