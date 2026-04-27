/**
 * Daleel Madani scraper — Playwright + stealth (cross-platform).
 *
 * Daleel Madani is protected by Cloudflare Managed Challenge. We use
 * playwright-extra + puppeteer-extra-plugin-stealth to bypass it, reusing
 * a single browser session for all pages (so CF cookies persist).
 *
 * Strategy:
 * 1. Batch-fetch listing pages (calls-for-proposal) using a shared browser context.
 * 2. Parse with cheerio — same HTML structure as before.
 * 3. Batch-fetch detail pages in the same context.
 */

import * as cheerio from "cheerio";
import { batchFetchWithPlaywright } from "./playwright-scraper";

const BASE_URL = "https://daleel-madani.org";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScrapedOpportunity {
  title: string;
  sourceUrl: string;
  externalId: string;
  organizationName: string;
  organizationUrl: string;
  country: string;
  typeOfCall: string;
  deadline: string | null;
  deadlineParsed: Date | null;
  fullDescription: string | null;
  interventionSectors: string[];
  remunerationRange: string | null;
  durationOfContract: string | null;
  relatedDocUrls: string[];
}

export interface ScrapeResult {
  opportunities: ScrapedOpportunity[];
  pagesScraped: number;
  totalFound: number;
  errors: string[];
}

// Backwards-compat stubs (no longer used)
export interface CfCookieStore { cookieHeader: string; cfClearance?: string; savedAt: number; }
export function loadCfCookie(): CfCookieStore | null { return null; }
export function saveCfCookie(_cookieHeader: string): void { /* no-op */ }
export function cfCookieAgeHours(): number | null { return null; }

// ─── Filters ──────────────────────────────────────────────────────────────────

const RELEVANT_SECTORS = [
  "media", "journalism", "democracy", "governance", "civil society",
  "human rights", "youth", "freedom of expression", "communication",
  "digital", "community", "arts and culture", "education", "gender",
  "advocacy", "culture", "information", "peace", "social justice",
  "transparency", "accountability", "press freedom",
];

const ELIGIBLE_GEO = [
  "lebanon", "mena", "arab", "middle east", "north africa",
  "regional", "global", "international", "all countries", "worldwide",
];

const EXCLUDED_TYPES = ["calls for tenders", "request for quotation", "rfq"];

function isRelevantSector(sectors: string[]): boolean {
  if (sectors.length === 0) return true;
  return sectors.some((s) => RELEVANT_SECTORS.some((r) => s.toLowerCase().includes(r)));
}

function isEligibleGeo(country: string): boolean {
  if (!country?.trim()) return true;
  return ELIGIBLE_GEO.some((k) => country.toLowerCase().includes(k));
}

function isExcludedCallType(type: string): boolean {
  return EXCLUDED_TYPES.some((e) => type.toLowerCase().includes(e));
}

function isCloudflarePage(html: string): boolean {
  if (html.length < 15000) return true;
  return (
    html.includes("_cf_chl_opt") ||
    html.includes('class="ch-title"') ||
    html.includes("Performing security verification") ||
    html.includes("<title>Just a moment")
  );
}

export function parseDeadline(raw: string | null): Date | null {
  if (!raw) return null;
  try {
    const cleaned = raw
      .replace(/\./g, " ")
      .replace(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[,\s]*/i, "")
      .trim();
    const d = new Date(cleaned);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

type ListingItem = {
  title: string; url: string; orgName: string; orgUrl: string;
  country: string; typeOfCall: string; deadlineRaw: string | null;
};

function parseListingPage(html: string): ListingItem[] {
  const $ = cheerio.load(html);
  const results: ListingItem[] = [];

  $(".views-row").each((_, el) => {
    const row = $(el);
    const titleEl = row.find(".field-name-title-field a, h4 a, h3 a, h2 a").first();
    const title = titleEl.text().trim();
    const relUrl = titleEl.attr("href") || "";
    if (!title || !relUrl) return;
    const url = relUrl.startsWith("http") ? relUrl : `${BASE_URL}${relUrl}`;

    const country = row.find(".field-name-field-country-multiple .field-item").first().text().trim();
    const typeOfCall = row.find(".field-name-field-type-of-call .field-item").first().text().trim();
    const deadlineEl = row.find(".field-name-field-application-deadline .date-display-single");
    let deadlineRaw: string | null =
      deadlineEl.attr("content") || deadlineEl.text().trim() || null;
    if (deadlineRaw && deadlineRaw.length > 60) deadlineRaw = deadlineRaw.substring(0, 60);

    const orgEl = row.find(".field-name-og-group-ref .field-item a").first();
    const orgName = orgEl.text().trim();
    const orgRelUrl = orgEl.attr("href") || "";
    const orgUrl = orgRelUrl
      ? (orgRelUrl.startsWith("http") ? orgRelUrl : `${BASE_URL}${orgRelUrl}`)
      : "";

    results.push({ title, url, orgName, orgUrl, country, typeOfCall, deadlineRaw });
  });

  return results;
}

type DetailData = {
  fullDescription: string | null; interventionSectors: string[];
  remunerationRange: string | null; durationOfContract: string | null;
  relatedDocUrls: string[]; externalId: string;
};

function parseDetailPage(html: string, url: string): DetailData {
  const $ = cheerio.load(html);

  const fullDescription =
    $(".field-name-body .field-items").first().text().trim().substring(0, 3000) ||
    $(".field-name-body .field-item").first().text().trim().substring(0, 3000) ||
    null;

  const interventionSectors = (
    $(".field-name-field-intervention-sector-s .field-item, [class*='intervention-sector'] .field-item")
      .first().text() || ""
  )
    .split(/[,\n|]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && !/^(intervention|sector)/i.test(s));

  const remunerationRange =
    $(".field-name-field-remuneration-range .field-item, [class*='remuneration'] .field-item")
      .first().text().replace(/remuneration.*?:/i, "").trim() || null;

  const durationOfContract =
    $(".field-name-field-duration-of-contract .field-item, [class*='duration-of-contract'] .field-item")
      .first().text().replace(/duration.*?:/i, "").trim() || null;

  const relatedDocUrls: string[] = [];
  $(".field-name-field-calls-documents a, [class*='calls-document'] a").each((_, el) => {
    const href = $(el).attr("href");
    if (href) relatedDocUrls.push(href.startsWith("http") ? href : `${BASE_URL}${href}`);
  });

  const externalId = url.replace(/\/$/, "").split("/").pop() || url;
  return { fullDescription, interventionSectors, remunerationRange, durationOfContract, relatedDocUrls, externalId };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export async function scrapeDaleelMadani(
  maxPages = 6,
  onProgress?: (msg: string) => void
): Promise<ScrapeResult> {
  const log = onProgress || console.log;
  const errors: string[] = [];
  const results: ScrapedOpportunity[] = [];
  let pagesScraped = 0;
  let totalFound = 0;

  log("Using Playwright + stealth to scrape Daleel Madani...");

  // ── Step 1: build listing URLs ────────────────────────────────────────────
  const listingUrls: string[] = [];
  for (let p = 0; p < maxPages; p++) {
    listingUrls.push(
      p === 0
        ? `${BASE_URL}/calls-for-proposal`
        : `${BASE_URL}/calls-for-proposal?page=${p}`
    );
  }

  log(`Fetching ${listingUrls.length} listing pages via Playwright...`);

  let listingHtmls: string[];
  try {
    listingHtmls = await batchFetchWithPlaywright(
      listingUrls,
      { waitAfterLoad: 2000, waitForSelector: ".views-row", requestDelay: 2000 },
      log
    );
  } catch (err) {
    const msg = `Daleel Madani listing fetch failed: ${(err as Error).message}`;
    errors.push(msg);
    log(`  ✗ ${msg}`);
    return { opportunities: [], pagesScraped: 0, totalFound: 0, errors };
  }

  // ── Step 2: parse listing pages ───────────────────────────────────────────
  const filteredItems: ListingItem[] = [];

  for (let i = 0; i < listingHtmls.length; i++) {
    const html = listingHtmls[i];
    if (!html || isCloudflarePage(html)) {
      log(`  Page ${i + 1}: CF blocked or empty — stopping.`);
      break;
    }
    const items = parseListingPage(html);
    log(`  Page ${i + 1}: ${items.length} rows parsed`);
    if (items.length === 0) break;
    pagesScraped++;
    totalFound += items.length;

    const now = new Date();
    for (const item of items) {
      if (isExcludedCallType(item.typeOfCall)) continue;
      if (!isEligibleGeo(item.country)) continue;
      const dl = parseDeadline(item.deadlineRaw);
      if (dl && dl < now) continue;
      filteredItems.push(item);
    }
  }

  log(`  ${filteredItems.length}/${totalFound} passed geo/type/deadline filter`);

  if (filteredItems.length === 0) {
    return { opportunities: results, pagesScraped, totalFound, errors };
  }

  // ── Step 3: batch-fetch detail pages ─────────────────────────────────────
  const detailUrls = filteredItems.map((i) => i.url);
  log(`\nFetching ${detailUrls.length} detail pages via Playwright...`);

  let detailHtmls: string[];
  try {
    detailHtmls = await batchFetchWithPlaywright(
      detailUrls,
      { waitAfterLoad: 1500, requestDelay: 2000 },
      log
    );
  } catch (err) {
    const msg = `Detail fetch failed: ${(err as Error).message}`;
    errors.push(msg);
    log(`  ✗ ${msg}`);
    // Fall back: listing data only
    for (const item of filteredItems) {
      results.push({
        title: item.title,
        sourceUrl: item.url,
        externalId: item.url.replace(/\/$/, "").split("/").pop() || item.url,
        organizationName: item.orgName,
        organizationUrl: item.orgUrl,
        country: item.country,
        typeOfCall: item.typeOfCall,
        deadline: item.deadlineRaw,
        deadlineParsed: parseDeadline(item.deadlineRaw),
        fullDescription: null,
        interventionSectors: [],
        remunerationRange: null,
        durationOfContract: null,
        relatedDocUrls: [],
      });
    }
    return { opportunities: results, pagesScraped, totalFound, errors };
  }

  // ── Step 4: parse details and combine ────────────────────────────────────
  for (let i = 0; i < filteredItems.length; i++) {
    const item = filteredItems[i];
    const detailHtml = detailHtmls[i] || "";

    if (!detailHtml || isCloudflarePage(detailHtml)) {
      log(`  ✗ CF blocked detail: ${item.title}`);
      continue;
    }

    const detail = parseDetailPage(detailHtml, item.url);

    if (
      detail.interventionSectors.length > 0 &&
      !isRelevantSector(detail.interventionSectors)
    ) {
      log(`  Skip (off-topic): ${item.title}`);
      continue;
    }

    results.push({
      title: item.title,
      sourceUrl: item.url,
      externalId: detail.externalId,
      organizationName: item.orgName,
      organizationUrl: item.orgUrl,
      country: item.country,
      typeOfCall: item.typeOfCall,
      deadline: item.deadlineRaw,
      deadlineParsed: parseDeadline(item.deadlineRaw),
      fullDescription: detail.fullDescription,
      interventionSectors: detail.interventionSectors,
      remunerationRange: detail.remunerationRange,
      durationOfContract: detail.durationOfContract,
      relatedDocUrls: detail.relatedDocUrls,
    });

    log(`  ✓ ${item.title}`);
  }

  return { opportunities: results, pagesScraped, totalFound, errors };
}
