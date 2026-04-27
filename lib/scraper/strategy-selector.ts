/**
 * Strategy selector — decides which scraping approach to use for a given URL.
 *
 * Tries in order:
 * 1. HTTP + __NEXT_DATA__ JSON (Next.js apps like For9a)
 * 2. HTTP + HTML cheerio parsing (generic sites)
 * 3. Playwright + stealth (JS-rendered or Cloudflare-protected sites)
 *
 * Returns a list of ScrapedOpportunity objects regardless of strategy used.
 */

import type { ScrapedOpportunity } from "./daleel-madani";
import {
  fetchHtml,
  extractNextData,
  parseGenericListingHtml,
  simpleToScraped,
  isAllowedByRobots,
} from "./http-scraper";
import { fetchWithPlaywright } from "./playwright-scraper";

export type ScrapeStrategy = "HTTP_JSON" | "HTTP_HTML" | "PLAYWRIGHT" | "FAILED";

export interface StrategyResult {
  strategy: ScrapeStrategy;
  opportunities: ScrapedOpportunity[];
  pagesScraped: number;
  totalFound: number;
  errors: string[];
}

// Known Cloudflare / JS-heavy domains that should skip straight to Playwright
const PLAYWRIGHT_DOMAINS = [
  "daleel-madani.org",
  "earthjournalism.net",
];

function isPlaywrightDomain(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return PLAYWRIGHT_DOMAINS.some((d) => hostname.includes(d));
  } catch { return false; }
}

/**
 * Scrape a single custom source URL using the best available strategy.
 * Returns up to `maxItems` opportunities.
 */
export async function scrapeSourceUrl(
  url: string,
  onProgress?: (msg: string) => void,
  maxItems = 50
): Promise<StrategyResult> {
  const log = onProgress || (() => {});
  const errors: string[] = [];

  // ── robots.txt check ──────────────────────────────────────────────────────
  const allowed = await isAllowedByRobots(url);
  if (!allowed) {
    const msg = `robots.txt disallows scraping ${url}`;
    log(`  ✗ ${msg}`);
    return { strategy: "FAILED", opportunities: [], pagesScraped: 0, totalFound: 0, errors: [msg] };
  }

  // ── Skip straight to Playwright for known difficult domains ───────────────
  if (isPlaywrightDomain(url)) {
    log(`  → Using Playwright (known Cloudflare domain)`);
    return scrapeWithPlaywright(url, log, maxItems);
  }

  // ── Strategy 1: HTTP + __NEXT_DATA__ ──────────────────────────────────────
  log(`  → Trying HTTP + JSON extraction...`);
  try {
    const html = await fetchHtml(url, { timeout: 10000 });
    const nextData = extractNextData<Record<string, unknown>>(html);

    if (nextData) {
      log(`  ✓ Found __NEXT_DATA__ — extracting opportunities from JSON`);
      const opps = extractOppsFromNextData(nextData, url);
      if (opps.length > 0) {
        log(`  ✓ HTTP+JSON: extracted ${opps.length} opportunities`);
        return {
          strategy: "HTTP_JSON",
          opportunities: opps.slice(0, maxItems),
          pagesScraped: 1,
          totalFound: opps.length,
          errors,
        };
      }
    }
  } catch (err) {
    log(`  ⚠ HTTP fetch failed: ${(err as Error).message}`);
    errors.push(`HTTP fetch: ${(err as Error).message}`);
  }

  // ── Strategy 2: HTTP + HTML ────────────────────────────────────────────────
  log(`  → Trying HTTP + HTML parsing...`);
  try {
    const html = await fetchHtml(url, { timeout: 10000 });
    const simple = parseGenericListingHtml(html, url);

    if (simple.length >= 3) {
      log(`  ✓ HTTP+HTML: found ${simple.length} items`);
      const opps = simple.slice(0, maxItems).map((s) => simpleToScraped(s));
      return {
        strategy: "HTTP_HTML",
        opportunities: opps,
        pagesScraped: 1,
        totalFound: simple.length,
        errors,
      };
    }
    log(`  ⚠ HTTP+HTML found only ${simple.length} items — trying Playwright`);
  } catch (err) {
    log(`  ⚠ HTTP+HTML failed: ${(err as Error).message}`);
    errors.push(`HTTP+HTML: ${(err as Error).message}`);
  }

  // ── Strategy 3: Playwright ────────────────────────────────────────────────
  return scrapeWithPlaywright(url, log, maxItems);
}

async function scrapeWithPlaywright(
  url: string,
  log: (msg: string) => void,
  maxItems: number
): Promise<StrategyResult> {
  log(`  → Using Playwright + stealth...`);
  const errors: string[] = [];

  try {
    const html = await fetchWithPlaywright(url, {
      waitAfterLoad: 3000,
      timeout: 40000,
    });

    // Try __NEXT_DATA__ first on rendered HTML
    const nextData = extractNextData<Record<string, unknown>>(html);
    if (nextData) {
      const opps = extractOppsFromNextData(nextData, url);
      if (opps.length > 0) {
        log(`  ✓ Playwright+JSON: extracted ${opps.length} opportunities`);
        return {
          strategy: "PLAYWRIGHT",
          opportunities: opps.slice(0, maxItems),
          pagesScraped: 1,
          totalFound: opps.length,
          errors,
        };
      }
    }

    const simple = parseGenericListingHtml(html, url);
    log(`  ✓ Playwright+HTML: found ${simple.length} items`);
    const opps = simple.slice(0, maxItems).map((s) => simpleToScraped(s));
    return {
      strategy: "PLAYWRIGHT",
      opportunities: opps,
      pagesScraped: 1,
      totalFound: simple.length,
      errors,
    };
  } catch (err) {
    const msg = `Playwright failed: ${(err as Error).message}`;
    errors.push(msg);
    log(`  ✗ ${msg}`);
    return { strategy: "FAILED", opportunities: [], pagesScraped: 0, totalFound: 0, errors };
  }
}

// ── Naive __NEXT_DATA__ opportunity extractor ─────────────────────────────────

function extractOppsFromNextData(
  data: Record<string, unknown>,
  baseUrl: string
): ScrapedOpportunity[] {
  const results: ScrapedOpportunity[] = [];

  function walk(node: unknown, depth = 0): void {
    if (depth > 8 || !node || typeof node !== "object") return;

    if (Array.isArray(node)) {
      for (const item of node) walk(item, depth + 1);
      return;
    }

    const obj = node as Record<string, unknown>;

    // Heuristic: object with title + url fields = opportunity candidate
    if (
      typeof obj.title === "string" &&
      obj.title.length > 5 &&
      (typeof obj.url === "string" || typeof obj.slug === "string" || typeof obj.link === "string")
    ) {
      const rawUrl = (obj.url || obj.slug || obj.link) as string;
      let fullUrl = rawUrl;
      if (!rawUrl.startsWith("http")) {
        try { fullUrl = new URL(rawUrl, baseUrl).href; } catch { /* skip */ }
      }

      const deadline =
        (obj.deadline || obj.deadline_date || obj.closes_at || obj.end_date) as string | null ?? null;

      let deadlineParsed: Date | null = null;
      if (deadline) {
        try {
          const d = new Date(String(deadline));
          if (!isNaN(d.getTime())) deadlineParsed = d;
        } catch { /* ignore */ }
      }

      results.push({
        title: obj.title,
        sourceUrl: fullUrl,
        externalId: String(obj.id || obj.slug || rawUrl).substring(0, 200),
        organizationName: String(obj.organization || obj.org || obj.funder || ""),
        organizationUrl: "",
        country: String(obj.country || obj.location || ""),
        typeOfCall: String(obj.type || obj.category || "Open Call"),
        deadline: deadline ? String(deadline) : null,
        deadlineParsed,
        fullDescription: String(obj.description || obj.summary || obj.body || "").substring(0, 2000) || null,
        interventionSectors: [],
        remunerationRange: null,
        durationOfContract: null,
        relatedDocUrls: [],
      });
      return; // don't descend into an already-matched object
    }

    for (const val of Object.values(obj)) walk(val, depth + 1);
  }

  walk(data);
  return results;
}
