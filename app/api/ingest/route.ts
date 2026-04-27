/**
 * POST /api/ingest
 *
 * Triggers scraping for the current workspace.
 * Source selection priority:
 *   1. `?source=<sourceId>` — scrape a single DB source by its ID
 *   2. Active `OpportunitySource` records in DB for this workspace
 *   3. Fallback to built-in sources if workspace has none configured
 *
 * Supports SSE streaming so the UI can show live progress.
 */

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { scrapeDaleelMadani } from "@/lib/scraper/daleel-madani";
import { scrapeEarthJournalism } from "@/lib/scraper/earth-journalism";
import { scrapeFor9a } from "@/lib/scraper/for9a";
import { scrapeSourceUrl } from "@/lib/scraper/strategy-selector";
import { processAndSaveOpportunities } from "@/lib/scraper/ingest-processor";
import type { ScrapedOpportunity } from "@/lib/scraper/daleel-madani";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max

interface ScraperJob {
  name: string;
  sourceId: string | null; // null for built-in scrapers
  run: (log: (msg: string) => void) => Promise<{
    opportunities: ScrapedOpportunity[];
    pagesScraped: number;
    totalFound: number;
    errors: string[];
  }>;
}

// Built-in scrapers — used as fallback when a workspace has no custom sources
const BUILTIN_SCRAPERS: ScraperJob[] = [
  {
    name: "Daleel Madani",
    sourceId: null,
    run: (log) => scrapeDaleelMadani(6, log),
  },
  {
    name: "Earth Journalism Network",
    sourceId: null,
    run: (log) => scrapeEarthJournalism(5, log),
  },
  {
    name: "For9a",
    sourceId: null,
    run: (log) => scrapeFor9a(3, log),
  },
];

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return new Response("No workspace found", { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as { source?: string };
  const requestedSourceId = body?.source; // DB source id

  // ── Build list of jobs ───────────────────────────────────────────────────────

  let jobs: ScraperJob[] = [];

  if (requestedSourceId) {
    // Single DB source requested
    const src = await db.opportunitySource.findFirst({
      where: { id: requestedSourceId, workspaceId },
    });
    if (!src) return new Response("Source not found", { status: 404 });

    jobs = [buildJobFromSource(src)];
  } else {
    // All active DB sources for this workspace
    const sources = await db.opportunitySource.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (sources.length > 0) {
      jobs = sources.map(buildJobFromSource);
    } else {
      // No custom sources → fall back to built-ins
      jobs = BUILTIN_SCRAPERS;
    }
  }

  // ── Create ingest log ────────────────────────────────────────────────────────

  const ingestLog = await db.ingestLog.create({
    data: {
      workspaceId,
      source: requestedSourceId ?? "ALL",
      status: "RUNNING",
    },
  });

  // ── Stream response ───────────────────────────────────────────────────────────

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = async (line: string) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ msg: line })}\n\n`));
    } catch { /* client disconnected */ }
  };

  (async () => {
    let totalImported = 0;
    let totalSkipped = 0;
    let totalPagesScraped = 0;
    let totalFound = 0;
    const allErrors: string[] = [];

    try {
      for (const job of jobs) {
        await send(`\n🔍 Starting ${job.name}...`);

        try {
          const result = await job.run((msg) => { send(msg).catch(() => {}); });

          await send(
            `✓ ${job.name}: ${result.opportunities.length} opportunities found across ${result.pagesScraped} pages.`
          );
          if (result.errors.length > 0) {
            await send(`  ⚠ ${result.errors.length} scrape error(s)`);
            allErrors.push(...result.errors);
          }

          await send(`💾 Saving ${job.name} results...`);

          const stats = await processAndSaveOpportunities(
            result.opportunities,
            ingestLog.id,
            (msg) => { send(msg).catch(() => {}); },
            job.name,
            workspaceId
          );

          totalImported += stats.imported;
          totalSkipped += stats.skipped;
          totalPagesScraped += result.pagesScraped;
          totalFound += result.totalFound;
          allErrors.push(...stats.errors);

          await send(`  ✅ ${job.name}: imported ${stats.imported}, skipped ${stats.skipped}`);

          // Update source lastScrapedAt
          if (job.sourceId) {
            await db.opportunitySource.update({
              where: { id: job.sourceId },
              data: {
                lastScrapedAt: new Date(),
                lastSuccessAt: stats.errors.length === 0 ? new Date() : undefined,
                lastError: stats.errors.length > 0 ? stats.errors[0] : null,
                lastErrorAt: stats.errors.length > 0 ? new Date() : undefined,
              },
            });
          }
        } catch (err) {
          const msg = `${job.name} failed: ${(err as Error).message}`;
          allErrors.push(msg);
          await send(`  ❌ ${msg}`);

          if (job.sourceId) {
            await db.opportunitySource.update({
              where: { id: job.sourceId },
              data: { lastScrapedAt: new Date(), lastError: msg, lastErrorAt: new Date() },
            });
          }
        }
      }

      await db.ingestLog.update({
        where: { id: ingestLog.id },
        data: {
          completedAt: new Date(),
          status: allErrors.length > 0 ? "PARTIAL" : "COMPLETED",
          pagesScraped: totalPagesScraped,
          found: totalFound,
          imported: totalImported,
          skipped: totalSkipped,
          errors: JSON.stringify(allErrors.slice(0, 20)),
        },
      });

      await send(
        `\n🎉 Done! Imported: ${totalImported} new, Skipped: ${totalSkipped} duplicates, Errors: ${allErrors.length}`
      );
      await send(
        `__DONE__:${JSON.stringify({ imported: totalImported, skipped: totalSkipped, errors: allErrors.length })}`
      );
    } catch (err) {
      const msg = `Fatal error: ${(err as Error).message}`;
      await db.ingestLog.update({
        where: { id: ingestLog.id },
        data: { completedAt: new Date(), status: "FAILED", errors: JSON.stringify([msg]) },
      });
      await send(`❌ ${msg}`);
      await send(`__DONE__:${JSON.stringify({ imported: 0, skipped: 0, errors: 1 })}`);
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

// GET — last 10 ingest logs for this workspace
export async function GET() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return new Response("No workspace", { status: 403 });
  }

  const logs = await db.ingestLog.findMany({
    where: { workspaceId },
    orderBy: { startedAt: "desc" },
    take: 10,
  });

  return Response.json(logs);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildJobFromSource(src: {
  id: string;
  name: string;
  url: string;
  strategy: string;
}): ScraperJob {
  // Check if the URL maps to one of our specialist scrapers
  const hostname = (() => { try { return new URL(src.url).hostname; } catch { return ""; } })();

  if (hostname.includes("daleel-madani.org")) {
    return { name: src.name, sourceId: src.id, run: (log) => scrapeDaleelMadani(6, log) };
  }
  if (hostname.includes("earthjournalism.net")) {
    return { name: src.name, sourceId: src.id, run: (log) => scrapeEarthJournalism(5, log) };
  }
  if (hostname.includes("for9a.com")) {
    return { name: src.name, sourceId: src.id, run: (log) => scrapeFor9a(3, log) };
  }

  // Generic source — use strategy selector
  return {
    name: src.name,
    sourceId: src.id,
    run: async (log) => {
      log(`  Scraping ${src.url} with strategy: ${src.strategy}`);
      const result = await scrapeSourceUrl(src.url);
      log(`  Strategy used: ${result.strategy} — found ${result.opportunities.length}`);
      return {
        opportunities: result.opportunities,
        pagesScraped: result.pagesScraped,
        totalFound: result.totalFound,
        errors: result.errors,
      };
    },
  };
}
