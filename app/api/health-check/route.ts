/**
 * Health Check API
 *
 * GET  /api/health-check        — returns current health status of all sources
 * POST /api/health-check        — triggers an immediate health check run (SSE stream)
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { runWorkspaceHealthCheck } from "@/lib/monitoring/source-checker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ── GET — current source health statuses ─────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return new Response("No workspace", { status: 403 });
  }

  const sources = await db.opportunitySource.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      url: true,
      strategy: true,
      isActive: true,
      healthStatus: true,
      healthCheckedAt: true,
      healthError: true,
      consecutiveFailures: true,
      lastScrapedAt: true,
      lastSuccessAt: true,
      lastError: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Also get stuck job count
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const stuckCount = await db.ingestLog.count({
    where: { workspaceId, status: "RUNNING", startedAt: { lt: thirtyMinutesAgo } },
  });

  return Response.json({ sources, stuckJobs: stuckCount });
}

// ── POST — run health check now (SSE stream) ──────────────────────────────────
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return new Response("No workspace", { status: 403 });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = async (msg: string) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`));
    } catch { /* client disconnected */ }
  };

  (async () => {
    try {
      await send("🔍 Starting health check for all sources...");

      const report = await runWorkspaceHealthCheck(workspaceId);

      if (report.stuckJobsFixed > 0) {
        await send(`🔧 Fixed ${report.stuckJobsFixed} stuck scan job(s)`);
      }

      for (const src of report.sources) {
        const icon = src.newStatus === "HEALTHY" ? "✅" : src.newStatus === "DEGRADED" ? "⚠️" : "❌";
        await send(`${icon} ${src.sourceName}: ${src.newStatus}`);
        for (const check of src.checks.filter((c) => !c.passed)) {
          await send(`   → ${check.message}`);
        }
      }

      await send(
        `\n✅ Done — ${report.summary.healthy} healthy, ${report.summary.degraded} degraded, ${report.summary.failing} failing`
      );
      await send(`__DONE__:${JSON.stringify(report.summary)}`);
    } catch (err) {
      await send(`❌ Health check error: ${(err as Error).message}`);
      await send(`__DONE__:${JSON.stringify({ error: true })}`);
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
