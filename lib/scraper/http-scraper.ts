/**
 * HTTP scraper — fetch + cheerio, no browser.
 *
 * Used for sites that don't require JS rendering or bot-detection bypass.
 * Tries __NEXT_DATA__ JSON extraction first (Next.js apps), falls back to
 * cheerio HTML parsing against common listing patterns.
 */

import * as cheerio from "cheerio";
import type { ScrapedOpportunity } from "./daleel-madani";

const DEFAULT_UA =
  "Mozilla/5.0 (compatible; SpotCastBot/1.0; +https://spotcast.io/bot) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface HttpFetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

// ─── robots.txt check ─────────────────────────────────────────────────────────

const robotsCache = new Map<string, boolean>();

export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const { origin } = new URL(url);
    if (robotsCache.has(origin)) return robotsCache.get(origin)!;

    const robotsUrl = `${origin}/robots.txt`;
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": DEFAULT_UA },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      robotsCache.set(origin, true); // no robots.txt = allowed
      return true;
    }

    const text = await res.text();

    // Simple parser: find User-agent: * or User-agent: SpotCastBot blocks
    const lines = text.split("\n").map((l) => l.trim().toLowerCase());
    let inRelevantBlock = false;
    let allowed = true;

    for (const line of lines) {
      if (line.startsWith("user-agent:")) {
        const agent = line.replace("user-agent:", "").trim();
        inRelevantBlock = agent === "*" || agent === "spotcastbot";
      }
      if (inRelevantBlock && line.startsWith("disallow:")) {
        const path = line.replace("disallow:", "").trim();
        const urlPath = new URL(url).pathname;
        if (path && urlPath.startsWith(path)) {
          allowed = false;
          break;
        }
      }
    }

    robotsCache.set(origin, allowed);
    return allowed;
  } catch {
    return true; // network error = assume allowed
  }
}

// ─── Raw fetch ────────────────────────────────────────────────────────────────

export async function fetchHtml(url: string, options: HttpFetchOptions = {}): Promise<string> {
  const { headers = {}, timeout = 15000 } = options;

  const res = await fetch(url, {
    headers: {
      "User-Agent": DEFAULT_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Cache-Control": "no-cache",
      ...headers,
    },
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }

  return res.text();
}

// ─── __NEXT_DATA__ extraction ─────────────────────────────────────────────────

export function extractNextData<T = unknown>(html: string): T | null {
  try {
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]+?)<\/script>/);
    if (!match) return null;
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

// ─── Generic listing HTML parser ──────────────────────────────────────────────

export interface SimpleOpportunity {
  title: string;
  url: string;
  description: string | null;
  deadline: string | null;
}

/**
 * Attempts to extract opportunities from a generic HTML page by probing
 * common Drupal/WordPress/custom listing patterns. Returns an empty array
 * if nothing recognizable is found.
 */
export function parseGenericListingHtml(html: string, baseUrl: string): SimpleOpportunity[] {
  const $ = cheerio.load(html);
  const results: SimpleOpportunity[] = [];

  // Probe selectors in priority order
  const SELECTORS = [
    ".views-row",
    "article",
    ".opportunity",
    ".grant",
    ".listing-item",
    '[class*="opportunity"]',
    '[class*="grant"]',
    "li.item",
  ];

  let $rows = $();
  for (const sel of SELECTORS) {
    const found = $(sel);
    if (found.length >= 3) {
      $rows = found;
      break;
    }
  }

  if ($rows.length === 0) return results;

  $rows.each((_, el) => {
    const row = $(el);
    const $link = row.find("a[href]").first();
    const title = ($link.text() || row.find("h1,h2,h3,h4").first().text()).trim();
    const relUrl = $link.attr("href") || "";
    if (!title || !relUrl) return;

    let url = relUrl;
    if (!url.startsWith("http")) {
      try { url = new URL(relUrl, baseUrl).href; } catch { return; }
    }

    const descEl = row.find("p, .description, .summary, .body").first();
    const description = descEl.text().trim().substring(0, 500) || null;

    // Look for deadline-like text
    let deadline: string | null = null;
    row.find("*").each((_, node) => {
      const text = $(node).text();
      if (/deadline|closing date|apply by/i.test(text) && text.length < 100) {
        deadline = text.replace(/deadline|closing date|apply by/gi, "").replace(/[:]/g, "").trim();
      }
    });

    results.push({ title, url, description, deadline });
  });

  return results;
}

/**
 * Convert SimpleOpportunity to ScrapedOpportunity shape for the ingest processor.
 */
export function simpleToScraped(
  opp: SimpleOpportunity,
  defaults: Partial<ScrapedOpportunity> = {}
): ScrapedOpportunity {
  const deadlineParsed = opp.deadline
    ? (() => {
        try {
          const d = new Date(opp.deadline!);
          return isNaN(d.getTime()) ? null : d;
        } catch { return null; }
      })()
    : null;

  return {
    title: opp.title,
    sourceUrl: opp.url,
    externalId: opp.url.replace(/\/$/, "").split("/").pop() || opp.url,
    organizationName: "",
    organizationUrl: "",
    country: "",
    typeOfCall: "Open Call",
    deadline: opp.deadline,
    deadlineParsed,
    fullDescription: opp.description,
    interventionSectors: [],
    remunerationRange: null,
    durationOfContract: null,
    relatedDocUrls: [],
    ...defaults,
  };
}
