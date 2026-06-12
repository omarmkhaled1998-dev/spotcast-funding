/**
 * GET /api/cron/ingest
 *
 * Called by Vercel Cron Jobs daily. Vercel passes an Authorization header with
 * CRON_SECRET to prevent unauthorized triggers.
 *
 * Forwards to the existing /api/ingest logic but runs as a system job
 * (no user session required).
 */

import { db } from "@/lib/db";
import { scrapeDaleelMadani } from "@/lib/scraper/daleel-madani";
import { scrapeEarthJournalism } from "@/lib/scraper/earth-journalism";
import { scrapeFor9a } from "@/lib/scraper/for9a";
import { processAndSaveOpportunities } from "@/lib/scraper/ingest-processor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const log: string[] = [];
  const push = (msg: string) => { log.push(msg); console.log("[cron/ingest]", msg); };

  push("Cron ingest started");

  // Find all workspaces with active sources, or run built-ins for all workspaces
  const workspaces = await db.workspace.findMany({ select: { id: true } });
  push(`Found ${workspaces.length} workspace(s)`);

  let totalImported = 0;
  let totalErrors = 0;

  for (const ws of workspaces) {
    const sources = await db.opportunitySource.findMany({
      where: { workspaceId: ws.id, isActive: true },
    });

    const ingestLog = await db.ingestLog.create({
      data: { workspaceId: ws.id, source: "CRON", status: "RUNNING" },
    });

    const jobs = sources.length > 0
      ? sources.map((src: { id: string; name: string; url: string }) => {
          const hostname = (() => { try { return new URL(src.url).hostname; } catch { return ""; } })();
          if (hostname.includes("daleel-madani.org")) return { name: src.name, run: (l: (m: string) => void) => scrapeDaleelMadani(6, l) };
          if (hostname.includes("earthjournalism.net")) return { name: src.name, run: (l: (m: string) => void) => scrapeEarthJournalism(5, l) };
          if (hostname.includes("for9a.com")) return { name: src.name, run: (l: (m: string) => void) => scrapeFor9a(3, l) };
          return null;
        }).filter(Boolean) as { name: string; run: (l: (m: string) => void) => Promise<{ opportunities: unknown[]; pagesScraped: number; totalFound: number; errors: string[] }> }[]
      : [
          { name: "Daleel Madani", run: (l: (m: string) => void) => scrapeDaleelMadani(6, l) },
          { name: "Earth Journalism Network", run: (l: (m: string) => void) => scrapeEarthJournalism(5, l) },
          { name: "For9a", run: (l: (m: string) => void) => scrapeFor9a(3, l) },
        ];

    let imported = 0;
    const errors: string[] = [];

    for (const job of jobs) {
      try {
        push(`  Running ${job.name} for workspace ${ws.id}...`);
        const result = await job.run(push);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stats = await processAndSaveOpportunities(result.opportunities as any[], ingestLog.id, push, job.name, ws.id);
        imported += stats.imported;
        errors.push(...stats.errors);
        push(`  ✓ ${job.name}: imported ${stats.imported}`);
      } catch (err) {
        const msg = `${job.name} failed: ${(err as Error).message}`;
        errors.push(msg);
        push(`  ✗ ${msg}`);
      }
    }

    await db.ingestLog.update({
      where: { id: ingestLog.id },
      data: {
        completedAt: new Date(),
        status: errors.length > 0 ? "PARTIAL" : "COMPLETED",
        imported,
        errors: JSON.stringify(errors.slice(0, 20)),
      },
    });

    totalImported += imported;
    totalErrors += errors.length;
  }

  push(`Cron done — imported: ${totalImported}, errors: ${totalErrors}`);

  return Response.json({ ok: true, imported: totalImported, errors: totalErrors, log });
}
