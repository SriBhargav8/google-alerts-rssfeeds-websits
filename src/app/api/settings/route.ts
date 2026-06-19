import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getEncryptedKey } from "@/lib/crypto/api-keys";

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const payload = { ...data };
    
    if (payload.ai_providers) {
      try {
        const incomingProviders = JSON.parse(payload.ai_providers);
        
        // Fetch existing config from DB to restore masked keys
        const existingSettings = await prisma.appSettings.findUnique({
          where: { key: "ai_providers" }
        });
        
        let existingProviders: any[] = [];
        if (existingSettings?.value) {
          existingProviders = JSON.parse(existingSettings.value);
        }
        
        const processedProviders = incomingProviders.map((p: any) => {
          let finalKey = p.apiKey || "";
          
          if (finalKey.includes("•")) {
            // Masked key: restore the existing encrypted key from database
            const existing = existingProviders.find((ep: any) => ep.id === p.id);
            if (existing) {
              finalKey = existing.apiKey || "";
            } else {
              finalKey = "";
            }
          } else if (finalKey) {
            // New raw key: encrypt it
            finalKey = getEncryptedKey(finalKey);
          }
          
          return {
            ...p,
            apiKey: finalKey
          };
        });
        
        payload.ai_providers = JSON.stringify(processedProviders);
      } catch (e: any) {
        console.error("Error processing AI providers in PUT settings:", e);
      }
    }

    const keys = Object.keys(payload);
    
    // Execute all upserts in a transaction
    await prisma.$transaction(
      keys.map(key => 
        prisma.appSettings.upsert({
          where: { key },
          update: { value: payload[key] },
          create: { key, value: payload[key] },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
