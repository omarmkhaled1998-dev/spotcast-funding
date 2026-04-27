/**
 * Playwright + stealth scraper — cross-platform replacement for AppleScript.
 *
 * Uses playwright-extra + puppeteer-extra-plugin-stealth to bypass Cloudflare
 * Managed Challenge and similar bot-detection. Works on macOS, Linux (Railway),
 * and Windows.
 *
 * Max concurrent Playwright instances: 2 (Railway memory limits).
 */

import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Register stealth plugin once
chromium.use(StealthPlugin());

// Semaphore to cap concurrent browser instances
let activeInstances = 0;
const MAX_INSTANCES = 2;
const instanceQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  return new Promise((resolve) => {
    if (activeInstances < MAX_INSTANCES) {
      activeInstances++;
      resolve();
    } else {
      instanceQueue.push(() => {
        activeInstances++;
        resolve();
      });
    }
  });
}

function releaseSlot() {
  activeInstances--;
  if (instanceQueue.length > 0) {
    const next = instanceQueue.shift()!;
    next();
  }
}

export interface PlaywrightFetchOptions {
  /** How long to wait after page load for JS rendering (ms). Default: 2000 */
  waitAfterLoad?: number;
  /** Max page load timeout (ms). Default: 30000 */
  timeout?: number;
  /** Wait for a CSS selector to appear before returning HTML */
  waitForSelector?: string;
  /** Minimum delay between requests in the same browser session (ms). Default: 1500 */
  requestDelay?: number;
}

/**
 * Fetch a single URL with a stealth Playwright browser.
 * Returns the page's outerHTML after JS rendering.
 */
export async function fetchWithPlaywright(
  url: string,
  options: PlaywrightFetchOptions = {}
): Promise<string> {
  const {
    waitAfterLoad = 2000,
    timeout = 30000,
    waitForSelector,
    requestDelay: _requestDelay = 1500,
  } = options;

  await acquireSlot();

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
    });

    const page = await context.newPage();

    // Block images and fonts to speed things up
    await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}", (route) =>
      route.abort()
    );

    await page.goto(url, { waitUntil: "domcontentloaded", timeout });

    // Wait for Cloudflare challenge to clear (max ~30s)
    let cfCleared = false;
    for (let i = 0; i < 30; i++) {
      const title = await page.title().catch(() => "");
      if (
        !title.includes("Just a moment") &&
        !title.includes("Performing security") &&
        !title.includes("Please Wait") &&
        !title.includes("Checking your browser")
      ) {
        cfCleared = true;
        break;
      }
      await page.waitForTimeout(1000);
    }

    if (!cfCleared) {
      throw new Error(`Cloudflare challenge not cleared for: ${url}`);
    }

    // Wait for JS rendering
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
    } else {
      await page.waitForTimeout(waitAfterLoad);
    }

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return html;
  } finally {
    await browser.close().catch(() => {});
    releaseSlot();
  }
}

/**
 * Fetch multiple URLs reusing the SAME browser context (much faster for
 * sites like Daleel Madani where Cloudflare cookies persist in the session).
 */
export async function batchFetchWithPlaywright(
  urls: string[],
  options: PlaywrightFetchOptions = {},
  onProgress?: (msg: string) => void
): Promise<string[]> {
  const {
    waitAfterLoad = 1500,
    timeout = 30000,
    waitForSelector,
    requestDelay = 1500,
  } = options;

  const log = onProgress || (() => {});

  if (urls.length === 0) return [];

  await acquireSlot();

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  });

  const results: string[] = [];

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
    });

    // Block images and fonts
    await context.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}", (route) =>
      route.abort()
    );

    const page = await context.newPage();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        log(`  [${i + 1}/${urls.length}] ${url}`);

        await page.goto(url, { waitUntil: "domcontentloaded", timeout });

        // Wait for CF challenge to clear
        for (let j = 0; j < 30; j++) {
          const title = await page.title().catch(() => "");
          if (
            !title.includes("Just a moment") &&
            !title.includes("Performing security") &&
            !title.includes("Please Wait") &&
            !title.includes("Checking your browser")
          ) break;
          await page.waitForTimeout(1000);
        }

        if (waitForSelector) {
          await page.waitForSelector(waitForSelector, { timeout: 8000 }).catch(() => {});
        } else {
          await page.waitForTimeout(waitAfterLoad);
        }

        const html = await page.evaluate(() => document.documentElement.outerHTML);
        results.push(html);

        // Polite delay between requests
        if (i < urls.length - 1) {
          const delay = requestDelay + Math.random() * 500;
          await page.waitForTimeout(delay);
        }
      } catch (err) {
        log(`  ✗ Failed: ${url} — ${(err as Error).message}`);
        results.push("");
      }
    }
  } finally {
    await browser.close().catch(() => {});
    releaseSlot();
  }

  return results;
}
