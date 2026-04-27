/**
 * Earth Journalism Network scraper — Playwright + stealth (cross-platform).
 *
 * EJN (earthjournalism.net/opportunities) is a Drupal site with JS-rendered
 * content. We use playwright-extra + stealth to render the pages, then parse
 * with cheerio. Reuses a single browser context across all pages.
 *
 * All EJN opportunities are journalism / environment related — no topic
 * filtering needed. We only filter out expired deadlines.
 */

import * as cheerio from "cheerio";
import { batchFetchWithPlaywright } from "./playwright-scraper";
import type { ScrapedOpportunity } from "./daleel-madani";

const BASE_URL = "https://earthjournalism.net";
const LIST_URL = `${BASE_URL}/opportunities`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapeResult {
  opportunities: ScrapedOpportunity[];
  pagesScraped: number;
  totalFound: number;
  errors: string[];
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseDeadline(text: string | null): Date | null {
  if (!text?.trim()) return null;
  try {
    const d = new Date(text.trim());
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

type ListingRow = { title: string; url: string; type: string; deadlineRaw: string | null };

function parseListingPage(html: string): ListingRow[] {
  const $ = cheerio.load(html);
  const results: ListingRow[] = [];

  $(".view-opportunities-page__row.views-row").each((_, el) => {
    const row = $(el);
    const title = row.find("h3.node-opportunities-teaser__title").text().trim();
    const relUrl = row.find("a.node-opportunities-teaser__link").attr("href") || "";
    if (!title || !relUrl) return;

    const url = relUrl.startsWith("http") ? relUrl : `${BASE_URL}${relUrl}`;
    const type = row.find(".node-opportunities-teaser__type span").first().text().trim();
    const deadlineRaw =
      row.find(".node-opportunities-teaser__footer span span").first().text().trim() || null;

    results.push({ title, url, type, deadlineRaw });
  });

  return results;
}

function getTotalPages(html: string): number {
  const $ = cheerio.load(html);
  let max = 0;
  $(".pager__items a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const m = href.match(/page=(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1]));
  });
  return max + 1; // pages are 0-indexed
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeEarthJournalism(
  maxPages = 5,
  onProgress?: (msg: string) => void
): Promise<ScrapeResult> {
  const log = onProgress || console.log;
  const errors: string[] = [];
  const results: ScrapedOpportunity[] = [];
  let pagesScraped = 0;
  let totalFound = 0;

  log("Using Playwright + stealth to scrape Earth Journalism Network...");

  // ── Step 1: fetch first page to determine total pages ─────────────────────
  let firstHtml: string;
  try {
    log(`Fetching EJN page 1: ${LIST_URL}`);
    const htmls = await batchFetchWithPlaywright(
      [LIST_URL],
      {
        waitAfterLoad: 2500,
        waitForSelector: ".view-opportunities-page__row",
        requestDelay: 2000,
      },
      log
    );
    firstHtml = htmls[0] ?? "";
  } catch (err) {
    const msg = `EJN page 1 fetch failed: ${(err as Error).message}`;
    errors.push(msg);
    log(`  ✗ ${msg}`);
    return { opportunities: [], pagesScraped: 0, totalFound: 0, errors };
  }

  if (!firstHtml) {
    errors.push("EJN page 1 returned empty HTML");
    return { opportunities: [], pagesScraped: 0, totalFound: 0, errors };
  }

  log(`  HTML length: ${firstHtml.length} chars`);

  const totalPages = Math.min(getTotalPages(firstHtml), maxPages);
  log(`  Total pages detected: ${totalPages} (capped at ${maxPages})`);

  // ── Step 2: fetch remaining pages ─────────────────────────────────────────
  const remainingUrls: string[] = [];
  for (let page = 1; page < totalPages; page++) {
    remainingUrls.push(`${LIST_URL}?page=${page}`);
  }

  let remainingHtmls: string[] = [];
  if (remainingUrls.length > 0) {
    log(`Fetching ${remainingUrls.length} remaining EJN pages...`);
    try {
      remainingHtmls = await batchFetchWithPlaywright(
        remainingUrls,
        {
          waitAfterLoad: 2000,
          waitForSelector: ".view-opportunities-page__row",
          requestDelay: 2000,
        },
        log
      );
    } catch (err) {
      const msg = `EJN subsequent pages failed: ${(err as Error).message}`;
      errors.push(msg);
      log(`  ⚠ ${msg} — using first page only`);
    }
  }

  const allHtmls = [firstHtml, ...remainingHtmls];

  // ── Step 3: parse all pages ───────────────────────────────────────────────
  const now = new Date();

  for (const html of allHtmls) {
    if (!html) continue;
    const items = parseListingPage(html);
    pagesScraped++;
    totalFound += items.length;
    log(`  Parsed ${items.length} opportunities on page ${pagesScraped}`);

    for (const item of items) {
      const deadlineParsed = parseDeadline(item.deadlineRaw);
      if (deadlineParsed && deadlineParsed < now) {
        log(`  Skip (expired): ${item.title}`);
        continue;
      }

      const externalId = `ejn-${item.url.replace(/\/$/, "").split("/").pop() || item.url}`;

      results.push({
        title: item.title,
        sourceUrl: item.url,
        externalId,
        organizationName: "Earth Journalism Network",
        organizationUrl: BASE_URL,
        country: "Global",
        typeOfCall: item.type || "Open Call",
        deadline: item.deadlineRaw,
        deadlineParsed,
        fullDescription: null,
        interventionSectors: ["journalism", "media", "environment"],
        remunerationRange: null,
        durationOfContract: null,
        relatedDocUrls: [],
      });

      log(`  ✓ ${item.title}`);
    }
  }

  return { opportunities: results, pagesScraped, totalFound, errors };
}
