/**
 * Health Worker — starts the daily cron job inside the Next.js process.
 *
 * Schedule: runs at 06:00 UTC every day.
 * Also runs a cleanup every 30 minutes for stuck IngestLogs.
 *
 * Imported by instrumentation.ts on server startup.
 */

import cron from "node-cron";
import { db } from "@/lib/db";
import { runWorkspaceHealthCheck, fixStuckJobs } from "./source-checker";

let started = false;

/**
 * One-time startup migration: update any OpportunitySource rows that still
 * have strategy=APPLESCRIPT to PLAYWRIGHT. AppleScript only works on macOS;
 * on Railway (Linux) the ingest dispatcher already uses the Playwright scraper
 * for earthjournalism.net regardless of the stored strategy, but the health
 * checker and the UI should reflect the correct value.
 */
async function migrateApplescriptSources() {
  try {
    const result = await db.opportunitySource.updateMany({
      where: { strategy: "APPLESCRIPT" },
      data: { strategy: "PLAYWRIGHT" },
    });
    if (result.count > 0) {
      console.log(`[health-worker] Migrated ${result.count} source(s) from APPLESCRIPT → PLAYWRIGHT`);
    }
  } catch (err) {
    console.error("[health-worker] Failed to migrate APPLESCRIPT sources:", (err as Error).message);
  }
}

export function startHealthWorker() {
  if (started) return; // guard against hot-reload double-start
  started = true;

  // ── One-time startup migrations ──────────────────────────────────────────
  migrateApplescriptSources().catch(() => {});

  // ── Daily health check — 06:00 UTC ──────────────────────────────────────
  cron.schedule("0 6 * * *", async () => {
    console.log("[health-worker] Starting daily health check...");
    try {
      const workspaces = await db.workspace.findMany({ select: { id: true, name: true } });

      for (const ws of workspaces) {
        try {
          const report = await runWorkspaceHealthCheck(ws.id);

          console.log(
            `[health-worker] ${ws.name}: ` +
            `✅ ${report.summary.healthy} healthy, ` +
            `⚠️ ${report.summary.degraded} degraded, ` +
            `❌ ${report.summary.failing} failing` +
            (report.stuckJobsFixed > 0 ? `, 🔧 ${report.stuckJobsFixed} stuck jobs fixed` : "")
          );

          // Log failing/degraded sources for visibility
          for (const src of report.sources) {
            if (src.newStatus !== "HEALTHY") {
              const failedChecks = src.checks.filter((c) => !c.passed);
              console.warn(
                `[health-worker]   ⚠ ${src.sourceName}: ${failedChecks.map((c) => c.message).join(" | ")}`
              );
            }
          }
        } catch (err) {
          console.error(`[health-worker] Error checking workspace ${ws.name}:`, (err as Error).message);
        }
      }
    } catch (err) {
      console.error("[health-worker] Fatal error in daily check:", (err as Error).message);
    }
  }, { timezone: "UTC" });

  // ── Stuck-job cleanup — every 30 minutes ────────────────────────────────
  cron.schedule("*/30 * * * *", async () => {
    try {
      const workspaces = await db.workspace.findMany({ select: { id: true } });
      let totalFixed = 0;
      for (const ws of workspaces) {
        totalFixed += await fixStuckJobs(ws.id);
      }
      if (totalFixed > 0) {
        console.log(`[health-worker] Fixed ${totalFixed} stuck ingest job(s)`);
      }
    } catch (err) {
      console.error("[health-worker] Error in stuck-job cleanup:", (err as Error).message);
    }
  });

  console.log("[health-worker] Started — daily check at 06:00 UTC, stuck-job cleanup every 30 min");
}
