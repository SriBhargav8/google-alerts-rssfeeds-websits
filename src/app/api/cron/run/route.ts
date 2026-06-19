import { NextRequest, NextResponse } from "next/server";
import { runWorkflow } from "@/lib/pipeline";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workflowId } = await req.json();

    if (!workflowId) {
      return NextResponse.json({ error: "Missing workflowId" }, { status: 400 });
    }

    // Run asynchronously without awaiting so the endpoint returns immediately
    runWorkflow(workflowId).catch(console.error);

    return NextResponse.json({ message: "Workflow triggered", workflowId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
