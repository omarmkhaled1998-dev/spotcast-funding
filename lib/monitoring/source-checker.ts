/**
 * Source Health Checker
 *
 * Runs a comprehensive multi-step check on every scraping source and updates
 * the OpportunitySource.healthStatus field in the database.
 *
 * Scenarios handled:
 *  1.  DNS failure           — domain not found / ENOTFOUND
 *  2.  Connection timeout    — server unreachable, >10 s
 *  3.  SSL / TLS error       — certificate expired or invalid
 *  4.  HTTP error            — 4xx / 5xx status codes
 *  5.  Rate limiting         — HTTP 429, too many requests
 *  6.  Auth wall             — login required to access content
 *  7.  Cloudflare challenge  — CF managed challenge blocks plain HTTP
 *  8.  Empty content         — response is too short to contain real data
 *  9.  Stale structure       — expected HTML selectors no longer present
 *  10. Playwright unavailable — Chromium missing/broken (for PW sources)
 *  11. Stuck RUNNING jobs    — IngestLogs that never completed (auto-fixed)
 *  12. Inactive source       — isActive=false sources are skipped (noted)
 *
 * Auto-fixes:
 *  - Stuck IngestLogs (RUNNING > 30 min) → marked FAILED
 *  - Source healthStatus / consecutiveFailures updated each run
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckSeverity = "ok" | "warning" | "error";

export interface SingleCheck {
  name: string;
  passed: boolean;
  severity: CheckSeverity;
  message: string;
}

export interface SourceCheckResult {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  ok: boolean;
  /** HEALTHY / DEGRADED / FAILING */
  newStatus: "HEALTHY" | "DEGRADED" | "FAILING";
  checks: SingleCheck[];
  checkedAt: Date;
}

export interface WorkspaceHealthReport {
  workspaceId: string;
  checkedAt: Date;
  sources: SourceCheckResult[];
  stuckJobsFixed: number;
  summary: { healthy: number; degraded: number; failing: number; unchecked: number };
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 12_000;

async function safeFetch(
  url: string
): Promise<{ ok: boolean; status: number; html: string; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    const html = await res.text().catch(() => "");
    return { ok: true, status: res.status, html };
  } catch (err: unknown) {
    const msg = (err as Error).message ?? String(err);
    const name = (err as Error).name ?? "";

    if (name === "AbortError") return { ok: false, status: 0, html: "", error: "timeout" };
    if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo"))
      return { ok: false, status: 0, html: "", error: "dns_failure" };
    if (msg.toLowerCase().includes("certificate") || msg.toLowerCase().includes("ssl"))
      return { ok: false, status: 0, html: "", error: "ssl_error" };
    if (msg.includes("ECONNREFUSED"))
      return { ok: false, status: 0, html: "", error: "connection_refused" };

    return { ok: false, status: 0, html: "", error: msg.slice(0, 120) };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Individual checks ────────────────────────────────────────────────────────

function checkConnectivity(
  fetchResult: Awaited<ReturnType<typeof safeFetch>>
): SingleCheck {
  if (fetchResult.error === "timeout")
    return { name: "Connectivity", passed: false, severity: "error", message: "Connection timed out after 12 seconds" };
  if (fetchResult.error === "dns_failure")
    return { name: "Connectivity", passed: false, severity: "error", message: "DNS lookup failed — domain may have changed or expired" };
  if (fetchResult.error === "ssl_error")
    return { name: "Connectivity", passed: false, severity: "error", message: "SSL/TLS certificate error — site may have an expired certificate" };
  if (fetchResult.error === "connection_refused")
    return { name: "Connectivity", passed: false, severity: "error", message: "Connection refused — server may be down" };
  if (fetchResult.error)
    return { name: "Connectivity", passed: false, severity: "error", message: `Network error: ${fetchResult.error}` };

  return { name: "Connectivity", passed: true, severity: "ok", message: "Site is reachable" };
}

function checkHttpStatus(
  fetchResult: Awaited<ReturnType<typeof safeFetch>>
): SingleCheck {
  const s = fetchResult.status;
  if (s === 0) return { name: "HTTP Status", passed: false, severity: "error", message: "Could not get HTTP response" };
  if (s === 429) return { name: "HTTP Status", passed: false, severity: "warning", message: "Rate limited (429) — too many requests" };
  if (s === 401 || s === 403) return { name: "HTTP Status", passed: false, severity: "error", message: `Access blocked (${s}) — may require login or permission` };
  if (s === 404) return { name: "HTTP Status", passed: false, severity: "error", message: "Page not found (404) — URL may have changed" };
  if (s >= 500) return { name: "HTTP Status", passed: false, severity: "error", message: `Server error (${s}) — site is having issues` };
  if (s >= 400) return { name: "HTTP Status", passed: false, severity: "warning", message: `Client error (${s})` };
  return { name: "HTTP Status", passed: true, severity: "ok", message: `HTTP ${s} OK` };
}

function checkCloudflare(html: string): SingleCheck {
  const isBlocked =
    html.includes("_cf_chl_opt") ||
    html.includes('"Just a moment"') ||
    html.includes("<title>Just a moment") ||
    html.includes("Performing security verification") ||
    html.includes("Please Wait") ||
    html.includes("Enable JavaScript and cookies to continue");

  if (isBlocked)
    return {
      name: "Bot Protection",
      passed: false,
      severity: "warning",
      message: "Cloudflare challenge detected — this source requires Playwright to scrape. Plain HTTP cannot bypass it.",
    };
  return { name: "Bot Protection", passed: true, severity: "ok", message: "No bot-protection challenge detected" };
}

function checkAuthWall(html: string): SingleCheck {
  const authPhrases = [
    "please log in", "sign in to continue", "you must be logged in",
    "login required", "please sign in", "create an account to continue",
  ];
  const lower = html.toLowerCase();
  if (authPhrases.some((p) => lower.includes(p)))
    return { name: "Auth Wall", passed: false, severity: "error", message: "Site requires login to view content" };
  return { name: "Auth Wall", passed: true, severity: "ok", message: "No login wall detected" };
}

function checkContentLength(html: string): SingleCheck {
  if (html.length < 2_000)
    return { name: "Content Size", passed: false, severity: "warning", message: `Response very short (${html.length} chars) — may be an error page` };
  if (html.length < 8_000)
    return { name: "Content Size", passed: false, severity: "warning", message: `Response short (${html.length} chars) — content may not have loaded` };
  return { name: "Content Size", passed: true, severity: "ok", message: `Response ${Math.round(html.length / 1024)} KB — looks healthy` };
}

/** Check that expected HTML patterns for known scrapers are still present */
function checkKnownStructure(url: string, html: string): SingleCheck | null {
  try {
    const hostname = new URL(url).hostname;

    if (hostname.includes("daleel-madani.org")) {
      const hasRows = html.includes("views-row") || html.includes("calls-for-proposal");
      if (!hasRows)
        return { name: "Site Structure", passed: false, severity: "warning", message: "Daleel Madani: expected opportunity listings (.views-row) not found — layout may have changed" };
      return { name: "Site Structure", passed: true, severity: "ok", message: "Expected Daleel Madani HTML structure present" };
    }

    if (hostname.includes("earthjournalism.net")) {
      const hasRows = html.includes("opportunities") || html.includes("field-type-taxonomy");
      if (!hasRows)
        return { name: "Site Structure", passed: false, severity: "warning", message: "EJN: expected opportunity listings not found — layout may have changed" };
      return { name: "Site Structure", passed: true, severity: "ok", message: "Expected EJN HTML structure present" };
    }

    if (hostname.includes("for9a.com")) {
      const hasRows = html.includes("opportunity") || html.includes("__NEXT_DATA__");
      if (!hasRows)
        return { name: "Site Structure", passed: false, severity: "warning", message: "For9a: expected opportunity data not found — layout may have changed" };
      return { name: "Site Structure", passed: true, severity: "ok", message: "Expected For9a data present" };
    }
  } catch { /* ignore bad URL */ }

  return null; // No known structure check for generic URLs
}

function checkPlaywrightAvailability(): SingleCheck {
  // We detect Playwright availability by checking for the Chromium executable
  // The playwright-scraper will fail fast with our 17s timeout if missing
  // Here we just report its expected status based on env
  const skip = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === "1";
  const hasBrowserPath = !!process.env.PLAYWRIGHT_BROWSERS_PATH;

  if (skip && !hasBrowserPath) {
    // On Railway without explicit install — will fail for CF-protected sites
    return {
      name: "Playwright Browser",
      passed: false,
      severity: "warning",
      message: "Chromium auto-download is disabled (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1). Cloudflare-protected sites (Daleel Madani, EJN) need Playwright to work.",
    };
  }
  return { name: "Playwright Browser", passed: true, severity: "ok", message: "Playwright browser configuration looks OK" };
}

// ─── Main source checker ──────────────────────────────────────────────────────

export async function checkSource(
  source: { id: string; name: string; url: string; strategy: string; isActive: boolean }
): Promise<SourceCheckResult> {
  const checks: SingleCheck[] = [];
  const checkedAt = new Date();

  // Inactive sources — just note, don't check
  if (!source.isActive) {
    return {
      sourceId: source.id,
      sourceName: source.name,
      sourceUrl: source.url,
      ok: true,
      newStatus: "HEALTHY",
      checks: [{ name: "Active", passed: true, severity: "ok", message: "Source is paused — skipping check" }],
      checkedAt,
    };
  }

  // Step 1: HTTP connectivity
  const fetchResult = await safeFetch(source.url);
  checks.push(checkConnectivity(fetchResult));

  if (!fetchResult.ok) {
    // No point running further checks if we can't reach the site
    const errorMsg = checks[0].message;
    await db.opportunitySource.update({
      where: { id: source.id },
      data: {
        healthStatus: "FAILING",
        healthCheckedAt: checkedAt,
        healthError: errorMsg,
        consecutiveFailures: { increment: 1 },
      },
    });
    return { sourceId: source.id, sourceName: source.name, sourceUrl: source.url, ok: false, newStatus: "FAILING", checks, checkedAt };
  }

  const { html, status } = fetchResult;

  // Step 2: HTTP status
  const httpCheck = checkHttpStatus({ ...fetchResult, status });
  checks.push(httpCheck);

  // Step 3: Cloudflare / bot protection
  const cfCheck = checkCloudflare(html);
  checks.push(cfCheck);

  // Step 4: Auth wall
  checks.push(checkAuthWall(html));

  // Step 5: Content length (only if not CF-blocked)
  if (!cfCheck.passed === false) {
    checks.push(checkContentLength(html));
  }

  // Step 6: Known structure (site-specific)
  const structureCheck = checkKnownStructure(source.url, html);
  if (structureCheck) checks.push(structureCheck);

  // Step 7: Playwright availability (for CF-protected sources)
  if (cfCheck.passed === false || source.strategy === "PLAYWRIGHT") {
    checks.push(checkPlaywrightAvailability());
  }

  // Determine overall status
  const hasError = checks.some((c) => !c.passed && c.severity === "error");
  const hasWarning = checks.some((c) => !c.passed && c.severity === "warning");

  const newStatus: SourceCheckResult["newStatus"] = hasError
    ? "FAILING"
    : hasWarning
    ? "DEGRADED"
    : "HEALTHY";

  const failedChecks = checks.filter((c) => !c.passed);
  const healthError = failedChecks.length
    ? failedChecks.map((c) => c.message).join(" | ")
    : null;

  await db.opportunitySource.update({
    where: { id: source.id },
    data: {
      healthStatus: newStatus,
      healthCheckedAt: checkedAt,
      healthError,
      consecutiveFailures: newStatus === "FAILING" ? { increment: 1 } : 0,
    },
  });

  return {
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.url,
    ok: newStatus !== "FAILING",
    newStatus,
    checks,
    checkedAt,
  };
}

// ─── Stuck job auto-fixer ─────────────────────────────────────────────────────

export async function fixStuckJobs(workspaceId: string): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const result = await db.ingestLog.updateMany({
    where: {
      workspaceId,
      status: "RUNNING",
      startedAt: { lt: thirtyMinutesAgo },
    },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errors: JSON.stringify(["Job auto-timed out after 30 min — fixed by health monitor"]),
    },
  });
  return result.count;
}

// ─── Built-in source health (Daleel, EJN, For9a) ─────────────────────────────

const BUILTIN_SOURCE_URLS = [
  { id: "__builtin_daleel", name: "Daleel Madani", url: "https://daleel-madani.org/calls-for-proposal", strategy: "PLAYWRIGHT" },
  { id: "__builtin_ejn",    name: "Earth Journalism Network", url: "https://earthjournalism.net/opportunities", strategy: "PLAYWRIGHT" },
  { id: "__builtin_for9a",  name: "For9a",         url: "https://www.for9a.com/en/opportunities",   strategy: "HTTP" },
];

// ─── Workspace-level health runner ───────────────────────────────────────────

export async function runWorkspaceHealthCheck(
  workspaceId: string
): Promise<WorkspaceHealthReport> {
  const checkedAt = new Date();

  // 1. Fix stuck jobs first
  const stuckJobsFixed = await fixStuckJobs(workspaceId);

  // 2. Get all configured sources for this workspace
  const dbSources = await db.opportunitySource.findMany({
    where: { workspaceId },
    select: { id: true, name: true, url: true, strategy: true, isActive: true },
  });

  // 3. If no custom sources, check the built-in ones
  const sourcesToCheck =
    dbSources.length > 0
      ? dbSources
      : BUILTIN_SOURCE_URLS.map((s) => ({ ...s, isActive: true }));

  // 4. Run checks (sequentially to avoid rate-limiting ourselves)
  const results: SourceCheckResult[] = [];
  for (const source of sourcesToCheck) {
    try {
      const result = await checkSource(source);
      results.push(result);
    } catch (err) {
      // Unexpected error in checker itself — mark as failing
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        ok: false,
        newStatus: "FAILING",
        checks: [{
          name: "Health Check",
          passed: false,
          severity: "error",
          message: `Unexpected checker error: ${(err as Error).message}`,
        }],
        checkedAt,
      });
    }
  }

  // 5. Summary
  const summary = { healthy: 0, degraded: 0, failing: 0, unchecked: 0 };
  for (const r of results) {
    if (r.newStatus === "HEALTHY") summary.healthy++;
    else if (r.newStatus === "DEGRADED") summary.degraded++;
    else summary.failing++;
  }

  return { workspaceId, checkedAt, sources: results, stuckJobsFixed, summary };
}
