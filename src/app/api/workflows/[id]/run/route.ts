import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { runWorkflow } from "@/lib/pipeline";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Create the run record first so we can return the ID immediately
    const run = await prisma.workflowRun.create({
      data: { workflowId: params.id, status: "RUNNING" },
    });

    // Fire pipeline in background, passing the pre-created run ID
    runWorkflow(params.id, run.id).catch(console.error);

    return NextResponse.json({ success: true, runId: run.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
