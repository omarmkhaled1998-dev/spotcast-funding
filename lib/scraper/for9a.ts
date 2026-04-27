/**
 * For9a scraper — for9a.com/en
 *
 * For9a is a Next.js app that embeds all listing data inside __NEXT_DATA__
 * JSON on each category page. We can fetch it with a plain HTTP request
 * (no browser/Chrome needed) and parse the JSON directly.
 *
 * Categories scraped: Fellowships, Grants, Trainings-or-Workshops,
 * Competitions-and-Awards, Residencies-and-Exchange-Programs
 *
 * Pagination: ?page=N (1-indexed, 15 items per page)
 */

import type { ScrapedOpportunity } from "./daleel-madani";

const BASE_URL = "https://www.for9a.com";

// Categories relevant to SpotCast / journalism / media / civil society
const RELEVANT_CATEGORIES = [
  "Fellowships",
  "Grants",
  "Trainings-or-Workshops",
  "Competitions-and-Awards",
  "Residencies-and-Exchange-Programs",
] as const;

// Keywords that indicate relevance to journalism/media/civil society
const RELEVANT_KEYWORDS = [
  "journal", "media", "press", "report", "news", "communicat",
  "civil society", "democracy", "human rights", "advocacy",
  "freedom", "gender", "digital", "arts", "culture", "film",
  "documentary", "broadcast", "publish", "content", "storytell",
  "investigat", "data journalism", "podcast", "radio", "television",
  "environment", "climate", "social justice", "transparency",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface For9aOpp {
  id: string;
  url: string;
  title: string;
  deadline: string;
  no_deadline: boolean;
  closed: boolean;
  country: { place: { title: string; name: string } } | null;
  locations: Array<{ name: string }>;
  organization: { id: string; name: string; slug: string } | null;
  category: { name: string; url: string } | null;
  tags: Array<{ keyword: string }>;
}

interface For9aPageData {
  opportunities: {
    paginatorInfo: { total: number; hasMorePages: boolean };
    data: For9aOpp[];
  };
}

export interface ScrapeResult {
  opportunities: ScrapedOpportunity[];
  pagesScraped: number;
  totalFound: number;
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchCategoryPage(
  category: string,
  page: number
): Promise<For9aPageData | null> {
  const url = `${BASE_URL}/en/opportunity/category/${category}?page=${page}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) return null;

  const html = await res.text();
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    const pp = data?.props?.pageProps as For9aPageData | undefined;
    if (!pp?.opportunities?.data) return null;
    return pp;
  } catch {
    return null;
  }
}

function parseDeadline(raw: string, noDeadline: boolean): Date | null {
  if (noDeadline) return null;
  try {
    const d = new Date(raw);
    // For9a uses 1969-12-31 or 1970-01-01 as sentinel for "no deadline"
    if (isNaN(d.getTime())) return null;
    if (d.getFullYear() < 2000) return null;
    return d;
  } catch { return null; }
}

function getCountry(opp: For9aOpp): string {
  if (opp.country?.place?.title) return opp.country.place.title;
  if (opp.locations?.length > 0) return opp.locations[0].name;
  return "Global";
}

function isRelevant(opp: For9aOpp): boolean {
  const text = [
    opp.title,
    ...opp.tags.map((t) => t.keyword),
  ]
    .join(" ")
    .toLowerCase();

  return RELEVANT_KEYWORDS.some((kw) => text.includes(kw));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeFor9a(
  maxPagesPerCategory = 3,
  onProgress?: (msg: string) => void
): Promise<ScrapeResult> {
  const log = onProgress || console.log;
  const errors: string[] = [];
  const results: ScrapedOpportunity[] = [];
  const seenIds = new Set<string>();
  let pagesScraped = 0;
  let totalFound = 0;

  log("Fetching For9a opportunities (plain HTTP, no browser needed)...");

  for (const category of RELEVANT_CATEGORIES) {
    log(`\nCategory: ${category}`);
    let page = 1;

    while (page <= maxPagesPerCategory) {
      await sleep(800 + Math.random() * 400);

      try {
        log(`  Page ${page}...`);
        const data = await fetchCategoryPage(category, page);

        if (!data) {
          log(`  ✗ Failed to parse page ${page} of ${category}`);
          break;
        }

        const { paginatorInfo, data: items } = data.opportunities;
        totalFound += items.length;
        pagesScraped++;

        log(`  Got ${items.length} items (total: ${paginatorInfo.total})`);

        const now = new Date();

        for (const item of items) {
          if (seenIds.has(item.id)) continue;
          seenIds.add(item.id);

          // Skip closed
          if (item.closed) continue;

          // Parse and check deadline
          const deadlineParsed = parseDeadline(item.deadline, item.no_deadline);
          if (deadlineParsed && deadlineParsed < now) continue;

          // Relevance filter
          if (!isRelevant(item)) {
            log(`  Skip (not relevant): ${item.title}`);
            continue;
          }

          const country = getCountry(item);
          const orgName = item.organization?.name || "Unknown";
          const orgUrl = item.organization?.slug
            ? `${BASE_URL}/en/organization/${item.organization.slug}`
            : "";

          // External ID: For9a internal ID
          const externalId = `for9a-${item.id}`;

          // Map category to sectors
          const catName = item.category?.name || category;
          const sectors = mapCategoryToSectors(catName, item.tags);

          results.push({
            title: item.title,
            sourceUrl: item.url,
            externalId,
            organizationName: orgName,
            organizationUrl: orgUrl,
            country,
            typeOfCall: catName,
            deadline: item.no_deadline ? null : item.deadline,
            deadlineParsed,
            fullDescription: null,
            interventionSectors: sectors,
            remunerationRange: null,
            durationOfContract: null,
            relatedDocUrls: [],
          });

          log(`  ✓ ${item.title}`);
        }

        if (!paginatorInfo.hasMorePages) break;
        page++;
      } catch (err) {
        const msg = `For9a ${category} page ${page} error: ${(err as Error).message}`;
        errors.push(msg);
        log(`  ✗ ${msg}`);
        break;
      }
    }
  }

  return { opportunities: results, pagesScraped, totalFound, errors };
}

// ─── Sector mapping ───────────────────────────────────────────────────────────

function mapCategoryToSectors(
  categoryName: string,
  tags: Array<{ keyword: string }>
): string[] {
  const sectors = new Set<string>();
  const cat = categoryName.toLowerCase();

  if (cat.includes("fellowship")) sectors.add("journalism");
  if (cat.includes("grant")) sectors.add("media");
  if (cat.includes("training") || cat.includes("workshop")) sectors.add("education");
  if (cat.includes("competition") || cat.includes("award")) sectors.add("media");
  if (cat.includes("residency") || cat.includes("exchange")) sectors.add("arts and culture");

  // Add from tags
  const relevantTagMap: Record<string, string> = {
    journal: "journalism",
    media: "media",
    press: "journalism",
    report: "journalism",
    civil: "civil society",
    democracy: "democracy",
    "human rights": "human rights",
    advocacy: "advocacy",
    digital: "digital",
    environment: "environment",
    gender: "gender",
  };

  for (const tag of tags) {
    const kw = tag.keyword.toLowerCase();
    for (const [key, sector] of Object.entries(relevantTagMap)) {
      if (kw.includes(key)) sectors.add(sector);
    }
  }

  return Array.from(sectors);
}
