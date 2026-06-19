import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, cronSchedule, isActive, feeds, integrationIds, destinationConfigs, aiProviderId, logoUrl, systemPrompt, generateImages, cmsContentFormat, includeSourceLink, scrapeFullContent, generationMode, maxIndividualPosts, enableStrictFiltering, useNofollowLinks } = await req.json();

    if (!name || !cronSchedule || !feeds || feeds.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Delete existing relations to replace them
    await prisma.rssFeed.deleteMany({ where: { workflowId: params.id } });
    await prisma.workflowDestination.deleteMany({ where: { workflowId: params.id } });

    const workflow = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        name,
        cronSchedule,
        isActive: isActive !== undefined ? isActive : true,
        aiProviderId: aiProviderId || null,
        logoUrl: logoUrl || null,
        systemPrompt: systemPrompt || null,
        generateImages: generateImages !== undefined ? generateImages : false,
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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete the workflow (cascades or delete dependencies first)
    await prisma.rssFeed.deleteMany({ where: { workflowId: params.id } });
    await prisma.workflowDestination.deleteMany({ where: { workflowId: params.id } });
    await prisma.workflowRun.deleteMany({ where: { workflowId: params.id } });
    
    await prisma.workflow.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
