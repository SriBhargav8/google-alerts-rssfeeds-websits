import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
console.log("Starting AutoFeed Dynamic Cron Scheduler...");

// Keep track of running tasks by workflow ID
const activeTasks: Record<string, { task: cron.ScheduledTask, schedule: string }> = {};

async function syncWorkflows() {
  try {
    // 1. Fetch all active workflows from DB
    const activeWorkflows = await prisma.workflow.findMany({
      where: { isActive: true }
    });

    const activeWorkflowIds = new Set(activeWorkflows.map(w => w.id));

    // 2. Stop and remove any tasks that are no longer active or were deleted
    for (const [id, current] of Object.entries(activeTasks)) {
      if (!activeWorkflowIds.has(id)) {
        console.log(`[Scheduler] Stopping paused/deleted workflow: ${id}`);
        current.task.stop();
        delete activeTasks[id];
      }
    }

    // 3. Register or Update new active workflows
    for (const wf of activeWorkflows) {
      if (!wf.cronSchedule || !cron.validate(wf.cronSchedule)) {
        console.warn(`[Scheduler] Invalid or missing cron schedule for workflow ${wf.name} (${wf.id})`);
        continue;
      }

      const existing = activeTasks[wf.id];

      // If it exists but the cron schedule changed, stop the old one
      if (existing && existing.schedule !== wf.cronSchedule) {
        console.log(`[Scheduler] Updating changed schedule for workflow ${wf.name}`);
        existing.task.stop();
        delete activeTasks[wf.id];
      }

      // If it's not currently running, start it
      if (!activeTasks[wf.id]) {
        console.log(`[Scheduler] Scheduling: [${wf.name}] with cron '${wf.cronSchedule}'`);
        
        const task = cron.schedule(wf.cronSchedule, async () => {
          console.log(`[${new Date().toISOString()}] Executing Scheduled Workflow: ${wf.name} (${wf.id})`);
          try {
            // Ping the Next.js API route to trigger the run asynchronously
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const res = await fetch(`${baseUrl}/api/workflows/${wf.id}/run`, {
              method: "POST"
            });
            if (res.ok) {
              const data = await res.json();
              console.log(`  -> Triggered successfully!`);
            } else {
              console.error(`  -> Failed to trigger: ${await res.text()}`);
            }
          } catch (e) {
            console.error(`  -> Network error triggering workflow:`, e);
          }
        }, {
          timezone: "Asia/Kolkata"
        });

        activeTasks[wf.id] = { task, schedule: wf.cronSchedule };
      }
    }
  } catch (err) {
    console.error("[Scheduler] Error syncing workflows:", err);
  }
}

// Run the sync immediately on boot
syncWorkflows();

// Then poll the database every 1 minute to catch any new, paused, or edited workflows
setInterval(syncWorkflows, 60 * 1000);
