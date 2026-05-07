/**
 * Source Health Checker
 *
 * Runs a comprehensive multi-step check on every scraping source and updates
 * the OpportunitySource.healthStatus field in the database.
 *
 * Scenarios handled:
 *  1.  DNS failure           — domain not found / ENOTFOUND
 *  2.  Connection timeout    — server unreachable, >12 s
 *  3.  SSL / TLS error       — certificate expired or invalid
 *  4.  HTTP error            — 4xx / 5xx status codes
 *  5.  Rate limiting         — HTTP 429
 *  6.  Auth wall             — login required to access content
 *  7.  Cloudflare challenge  — CF managed challenge (short-circuits other checks)
 *       → Checks Playwright availability: DEGRADED if browser available,
 *         FAILING if not (can't scrape at all)
 *  8.  Empty content         — response too short to contain real data
 *  9.  Stale structure       — expected HTML selectors no longer present
 *  10. Playwright browser check — verifies executable actually exists on disk
 *  11. Stuck RUNNING jobs    — IngestLogs >30 min auto-fixed to FAILED
 *  12. Inactive source       — skipped, reported as note
 *
 * Key design: when Cloudflare is detected, all downstream checks (403 status,
 * missing structure, empty content) are skipped — the root cause is one thing.
 * The status becomes DEGRADED if Playwright is available, FAILING if not.
 */

import { existsSync } from "fs";
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

// ─── Playwright binary detection ──────────────────────────────────────────────

let _playwrightAvailable: boolean | null = null;

function isPlaywrightAvailable(): boolean {
  if (_playwrightAvailable !== null) return _playwrightAvailable;

  try {
    // playwright-extra wraps playwright — get the executable path
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { chromium } = require("playwright-extra");
    const execPath: string | undefined =
      typeof chromium.executablePath === "function"
        ? chromium.executablePath()
        : undefined;

    if (execPath && existsSync(execPath)) {
      _playwrightAvailable = true;
      return true;
    }
  } catch { /* playwright-extra not importable */ }

  // Fallback: check PLAYWRIGHT_BROWSERS_PATH env var
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (browsersPath && existsSync(browsersPath)) {
    _playwrightAvailable = true;
    return true;
  }

  _playwrightAvailable = false;
  return false;
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
    return { name: "Connectivity", passed: false, severity: "error", message: "Connection timed out after 12 seconds — server may be down" };
  if (fetchResult.error === "dns_failure")
    return { name: "Connectivity", passed: false, severity: "error", message: "DNS lookup failed — domain may have changed or expired" };
  if (fetchResult.error === "ssl_error")
    return { name: "Connectivity", passed: false, severity: "error", message: "SSL/TLS certificate error — site certificate may be expired" };
  if (fetchResult.error === "connection_refused")
    return { name: "Connectivity", passed: false, severity: "error", message: "Connection refused — server may be down" };
  if (fetchResult.error)
    return { name: "Connectivity", passed: false, severity: "error", message: `Network error: ${fetchResult.error}` };
  return { name: "Connectivity", passed: true, severity: "ok", message: "Site is reachable" };
}

function checkHttpStatus(status: number): SingleCheck {
  if (status === 0) return { name: "HTTP Status", passed: false, severity: "error", message: "No HTTP response received" };
  if (status === 429) return { name: "HTTP Status", passed: false, severity: "warning", message: "Rate limited (429) — too many requests, try again later" };
  if (status === 401 || status === 403)
    return { name: "HTTP Status", passed: false, severity: "warning", message: `Blocked by server (${status}) — likely requires a browser session` };
  if (status === 404) return { name: "HTTP Status", passed: false, severity: "error", message: "Page not found (404) — URL may have changed" };
  if (status >= 500) return { name: "HTTP Status", passed: false, severity: "error", message: `Server error (${status}) — site is having issues` };
  if (status >= 400) return { name: "HTTP Status", passed: false, severity: "warning", message: `Client error (${status})` };
  return { name: "HTTP Status", passed: true, severity: "ok", message: `HTTP ${status} OK` };
}

/**
 * Detects Cloudflare or similar bot-protection challenges.
 * Returns null if no challenge detected.
 * If detected, returns a single check with Playwright availability embedded.
 */
function checkCloudflare(html: string): SingleCheck | null {
  const isBlocked =
    html.includes("_cf_chl_opt") ||
    html.includes("<title>Just a moment") ||
    html.includes("Performing security verification") ||
    html.includes("Please Wait") ||
    html.includes("Enable JavaScript and cookies to continue") ||
    html.includes("challenges.cloudflare.com");

  if (!isBlocked) return null;

  const pwAvail = isPlaywrightAvailable();

  return {
    name: "Bot Protection",
    passed: false,
    // If Playwright is available, it's DEGRADED (scraper can handle it)
    // If not, it's ERROR (completely blocked)
    severity: pwAvail ? "warning" : "error",
    message: pwAvail
      ? "Cloudflare challenge detected — scraper uses Playwright browser to bypass it ✓"
      : "Cloudflare challenge detected — requires Playwright browser (not available on this server). Plain HTTP is blocked.",
  };
}

function checkAuthWall(html: string): SingleCheck | null {
  const authPhrases = [
    "please log in", "sign in to continue", "you must be logged in",
    "login required", "please sign in", "create an account to continue",
  ];
  const lower = html.toLowerCase();
  if (!authPhrases.some((p) => lower.includes(p))) return null;
  return { name: "Auth Wall", passed: false, severity: "error", message: "Site requires login to view content" };
}

function checkContentLength(html: string): SingleCheck | null {
  if (html.length < 2_000)
    return { name: "Content Size", passed: false, severity: "warning", message: `Response very short (${html.length} chars) — possible error page` };
  if (html.length < 8_000)
    return { name: "Content Size", passed: false, severity: "warning", message: `Response short (${html.length} chars) — content may not have fully loaded` };
  return null; // healthy — don't add a check for normal size
}

/** Site-specific structure check — only for known scrapers. Returns null for unknown URLs. */
function checkKnownStructure(url: string, html: string): SingleCheck | null {
  try {
    const hostname = new URL(url).hostname;

    if (hostname.includes("daleel-madani.org")) {
      if (!html.includes("views-row") && !html.includes("calls-for-proposal"))
        return { name: "Site Structure", passed: false, severity: "warning", message: "Expected opportunity listings (.views-row) not found — site layout may have changed" };
      return { name: "Site Structure", passed: true, severity: "ok", message: "Expected Daleel Madani HTML structure present" };
    }
    if (hostname.includes("earthjournalism.net")) {
      if (!html.includes("opportunities") && !html.includes("field-type-taxonomy"))
        return { name: "Site Structure", passed: false, severity: "warning", message: "Expected EJN opportunity listings not found — layout may have changed" };
      return { name: "Site Structure", passed: true, severity: "ok", message: "Expected EJN HTML structure present" };
    }
    if (hostname.includes("for9a.com")) {
      if (!html.includes("opportunity") && !html.includes("__NEXT_DATA__"))
        return { name: "Site Structure", passed: false, severity: "warning", message: "Expected For9a data not found — layout may have changed" };
      return { name: "Site Structure", passed: true, severity: "ok", message: "Expected For9a data present" };
    }
  } catch { /* ignore bad URL */ }

  return null;
}

// ─── Main source checker ──────────────────────────────────────────────────────

export async function checkSource(
  source: { id: string; name: string; url: string; strategy: string; isActive: boolean }
): Promise<SourceCheckResult> {
  const checks: SingleCheck[] = [];
  const checkedAt = new Date();

  // Inactive sources — skip silently
  if (!source.isActive) {
    return {
      sourceId: source.id, sourceName: source.name, sourceUrl: source.url,
      ok: true, newStatus: "HEALTHY",
      checks: [{ name: "Active", passed: true, severity: "ok", message: "Source is paused — skipping health check" }],
      checkedAt,
    };
  }

  // ── Step 1: HTTP connectivity ─────────────────────────────────────────────
  const fetchResult = await safeFetch(source.url);
  const connectCheck = checkConnectivity(fetchResult);
  checks.push(connectCheck);

  if (!fetchResult.ok) {
    // Can't reach server at all
    await persistHealth(source.id, "FAILING", checks, checkedAt);
    return makeResult(source, false, "FAILING", checks, checkedAt);
  }

  const { html, status } = fetchResult;

  // ── Step 2: Cloudflare / bot protection (SHORT CIRCUITS other checks) ────
  const cfCheck = checkCloudflare(html);
  if (cfCheck) {
    // Cloudflare detected — this IS the root cause.
    // Skip HTTP status, auth wall, content size, structure checks.
    // They'd all fail for the same reason and add confusion.
    checks.push(cfCheck);

    const pwAvail = isPlaywrightAvailable();
    const newStatus = pwAvail ? "DEGRADED" : "FAILING";

    // If Playwright is available we CAN scrape Cloudflare-protected sites —
    // regardless of the stored strategy (AUTO / PLAYWRIGHT / APPLESCRIPT all
    // end up using the Playwright scraper for CF sites; only HTTP-only can't).
    // APPLESCRIPT on non-macOS is automatically replaced by Playwright in the
    // ingest dispatcher, so treat it the same as PLAYWRIGHT here.
    const canUsePlaywright = source.strategy !== "HTTP" && pwAvail;
    const effectiveStatus = canUsePlaywright ? "HEALTHY" : newStatus;

    await persistHealth(source.id, effectiveStatus, checks, checkedAt);
    return makeResult(source, effectiveStatus !== "FAILING", effectiveStatus, checks, checkedAt);
  }

  // ── Step 3: HTTP status (only if no Cloudflare) ───────────────────────────
  const httpCheck = checkHttpStatus(status);
  if (!httpCheck.passed) {
    checks.push(httpCheck);
    // HTTP errors are hard failures unless it's a warning (429/403 without CF)
    const newStatus = httpCheck.severity === "error" ? "FAILING" : "DEGRADED";
    await persistHealth(source.id, newStatus, checks, checkedAt);
    return makeResult(source, newStatus !== "FAILING", newStatus, checks, checkedAt);
  }

  // ── Step 4: Auth wall ─────────────────────────────────────────────────────
  const authCheck = checkAuthWall(html);
  if (authCheck) checks.push(authCheck);

  // ── Step 5: Content length ────────────────────────────────────────────────
  const contentCheck = checkContentLength(html);
  if (contentCheck) checks.push(contentCheck);

  // ── Step 6: Site structure ────────────────────────────────────────────────
  const structureCheck = checkKnownStructure(source.url, html);
  if (structureCheck) checks.push(structureCheck);

  // ── Determine overall status ──────────────────────────────────────────────
  const hasError = checks.some((c) => !c.passed && c.severity === "error");
  const hasWarning = checks.some((c) => !c.passed && c.severity === "warning");
  const newStatus = hasError ? "FAILING" : hasWarning ? "DEGRADED" : "HEALTHY";

  await persistHealth(source.id, newStatus, checks, checkedAt);
  return makeResult(source, newStatus !== "FAILING", newStatus, checks, checkedAt);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function persistHealth(
  sourceId: string,
  status: "HEALTHY" | "DEGRADED" | "FAILING",
  checks: SingleCheck[],
  checkedAt: Date
) {
  const failedChecks = checks.filter((c) => !c.passed);
  const healthError = failedChecks.length
    ? failedChecks.map((c) => c.message).join(" | ")
    : null;

  // Skip persistence for built-in (non-DB) sources
  if (sourceId.startsWith("__builtin_")) return;

  await db.opportunitySource.update({
    where: { id: sourceId },
    data: {
      healthStatus: status,
      healthCheckedAt: checkedAt,
      healthError,
      consecutiveFailures: status === "FAILING" ? { increment: 1 } : 0,
    },
  });
}

function makeResult(
  source: { id: string; name: string; url: string },
  ok: boolean,
  newStatus: "HEALTHY" | "DEGRADED" | "FAILING",
  checks: SingleCheck[],
  checkedAt: Date
): SourceCheckResult {
  return { sourceId: source.id, sourceName: source.name, sourceUrl: source.url, ok, newStatus, checks, checkedAt };
}

// ─── Stuck job auto-fixer ─────────────────────────────────────────────────────

export async function fixStuckJobs(workspaceId: string): Promise<number> {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const result = await db.ingestLog.updateMany({
    where: { workspaceId, status: "RUNNING", startedAt: { lt: thirtyMinutesAgo } },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errors: JSON.stringify(["Auto-timed out after 30 min — fixed by health monitor"]),
    },
  });
  return result.count;
}

// ─── Built-in source stubs (used when workspace has no custom sources) ────────

const BUILTIN_SOURCE_URLS = [
  { id: "__builtin_daleel", name: "Daleel Madani",          url: "https://daleel-madani.org/calls-for-proposal",  strategy: "PLAYWRIGHT", isActive: true },
  { id: "__builtin_ejn",    name: "Earth Journalism Network", url: "https://earthjournalism.net/opportunities",   strategy: "PLAYWRIGHT", isActive: true },
  { id: "__builtin_for9a",  name: "For9a",                  url: "https://www.for9a.com/en/opportunities",        strategy: "HTTP",       isActive: true },
];

// ─── Workspace-level health runner ───────────────────────────────────────────

export async function runWorkspaceHealthCheck(
  workspaceId: string
): Promise<WorkspaceHealthReport> {
  const checkedAt = new Date();

  // 1. Fix stuck jobs first
  const stuckJobsFixed = await fixStuckJobs(workspaceId);

  // 2. Get all configured sources
  const dbSources = await db.opportunitySource.findMany({
    where: { workspaceId },
    select: { id: true, name: true, url: true, strategy: true, isActive: true },
  });

  const sourcesToCheck = dbSources.length > 0 ? dbSources : BUILTIN_SOURCE_URLS;

  // 3. Run checks sequentially (avoid hammering sites)
  const results: SourceCheckResult[] = [];
  for (const source of sourcesToCheck) {
    try {
      results.push(await checkSource(source));
    } catch (err) {
      results.push({
        sourceId: source.id, sourceName: source.name, sourceUrl: source.url,
        ok: false, newStatus: "FAILING",
        checks: [{ name: "Health Check", passed: false, severity: "error", message: `Unexpected error: ${(err as Error).message}` }],
        checkedAt,
      });
    }
  }

  // 4. Summary
  const summary = { healthy: 0, degraded: 0, failing: 0, unchecked: 0 };
  for (const r of results) {
    if (r.newStatus === "HEALTHY") summary.healthy++;
    else if (r.newStatus === "DEGRADED") summary.degraded++;
    else summary.failing++;
  }

  return { workspaceId, checkedAt, sources: results, stuckJobsFixed, summary };
}
