import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getSession, hasRole } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!hasRole(session, ["ADMIN", "EDITOR"])) {
      return NextResponse.json({ error: "Unauthorized. Editor or Admin access required." }, { status: 403 });
    }

    const { name, cronSchedule, feeds, integrationIds, destinationConfigs, aiProviderId, logoUrl, systemPrompt, isActive, generateImages, cmsContentFormat, includeSourceLink, scrapeFullContent, generationMode, maxIndividualPosts, enableStrictFiltering, useNofollowLinks } = await req.json();

    if (!name || !cronSchedule || !feeds || feeds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const workflow = await prisma.workflow.create({
      data: {
        name,
        cronSchedule,
        isActive: isActive !== undefined ? isActive : true,
        aiProviderId: aiProviderId || null,
        logoUrl: logoUrl || null,
        systemPrompt: systemPrompt || null,
        generateImages: generateImages !== undefined ? generateImages : false, // Default to false
        cmsContentFormat: cmsContentFormat || "LEXICAL",
        includeSourceLink: includeSourceLink !== undefined ? includeSourceLink : false,
        scrapeFullContent: scrapeFullContent !== undefined ? scrapeFullContent : false,
        enableStrictFiltering: enableStrictFiltering !== undefined ? enableStrictFiltering : true,
        useNofollowLinks: useNofollowLinks !== undefined ? useNofollowLinks : true,
        generationMode: generationMode || "ROUNDUP",
        maxIndividualPosts: maxIndividualPosts || 5,
        feeds: {
          create: feeds.map((f: { url: string; label: string }) => ({
            url: f.url,
            label: f.label || "Unnamed Feed",
          })),
        },
        destinations: {
          create: (integrationIds || []).map((id: string) => ({
            integrationId: id,
            config: destinationConfigs && destinationConfigs[id] ? JSON.stringify(destinationConfigs[id]) : null,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
