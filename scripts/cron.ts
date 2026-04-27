/**
 * Daily cron runner — schedules all scrapers at 8:00 AM every day.
 * Run with:  npm run cron
 * Keep this process running alongside the Next.js dev server.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = require("@prisma/adapter-pg");
import { PrismaClient } from "../app/generated/prisma/client";
import { scrapeDaleelMadani } from "../lib/scraper/daleel-madani";
import { scrapeEarthJournalism } from "../lib/scraper/earth-journalism";
import { scrapeFor9a } from "../lib/scraper/for9a";
import { processAndSaveOpportunities } from "../lib/scraper/ingest-processor";
import cron from "node-cron";

// Setup DB
const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/spotcast_dev";
const adapter = new PrismaPg({ url: dbUrl });
const db = new PrismaClient({ adapter } as any);

const SCRAPERS = [
  { name: "Daleel Madani", source: "DALEEL_MADANI", run: (log: (m: string) => void) => scrapeDaleelMadani(6, log) },
  { name: "Earth Journalism Network", source: "EARTH_JOURNALISM", run: (log: (m: string) => void) => scrapeEarthJournalism(5, log) },
  { name: "For9a", source: "FOR9A", run: (log: (m: string) => void) => scrapeFor9a(3, log) },
];

async function runIngest() {
  console.log(`\n[${new Date().toISOString()}] 🌐 Starting daily ingest...`);

  // Get first workspace (for backward compatibility with cron)
  const workspace = await db.workspace.findFirst({ select: { id: true } });
  const workspaceId = workspace?.id;

  if (!workspaceId) {
    console.error("❌ No workspace found — skipping ingest. Run seed first.");
    return;
  }

  const ingestLog = await db.ingestLog.create({
    data: { workspaceId, source: "ALL", status: "RUNNING" },
  });

  let totalImported = 0;
  let totalSkipped = 0;
  let totalPagesScraped = 0;
  let totalFound = 0;
  const allErrors: string[] = [];

  for (const scraper of SCRAPERS) {
    console.log(`\n🔍 ${scraper.name}...`);
    try {
      const result = await scraper.run((msg) => console.log(" ", msg));
      const stats = await processAndSaveOpportunities(
        result.opportunities,
        ingestLog.id,
        (msg) => console.log(" ", msg),
        scraper.name,
        workspaceId
      );
      totalImported += stats.imported;
      totalSkipped += stats.skipped;
      totalPagesScraped += result.pagesScraped;
      totalFound += result.totalFound;
      allErrors.push(...result.errors, ...stats.errors);
      console.log(`  ✅ ${scraper.name}: imported ${stats.imported}, skipped ${stats.skipped}`);
    } catch (err) {
      const msg = `${scraper.name} failed: ${(err as Error).message}`;
      console.error("❌", msg);
      allErrors.push(msg);
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

  console.log(
    `\n✅ Done — Imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${allErrors.length}\n`
  );
}

// Run once immediately on startup
runIngest();

// Schedule daily at 8:00 AM
cron.schedule("0 8 * * *", () => {
  runIngest();
});

console.log("⏰ Cron scheduler started — all sources scanned daily at 8:00 AM.");
console.log("   (Also running an initial scan now...)\n");
