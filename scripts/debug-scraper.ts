/**
 * Debug: tests Cloudflare bypass using playwright-extra stealth + visible Chrome + full cookies.
 * Run: npx tsx scripts/debug-scraper.ts
 */
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const CF_COOKIE_FILE = path.join(process.cwd(), ".cf-clearance.json");
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

type PCookie = {
  name: string; value: string; domain: string; path: string;
  httpOnly: boolean; secure: boolean; sameSite: "None" | "Lax" | "Strict";
};

function parseCookieHeader(header: string): PCookie[] {
  const result: PCookie[] = [];
  for (const pair of header.split(";").map(p => p.trim()).filter(Boolean)) {
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    result.push({
      name: pair.substring(0, eq).trim(),
      value: pair.substring(eq + 1).trim(),
      domain: ".daleel-madani.org", path: "/",
      httpOnly: false, secure: true, sameSite: "None",
    });
  }
  return result;
}

async function debug() {
  if (!fs.existsSync(CF_COOKIE_FILE)) {
    console.error("No .cf-clearance.json found. Save the cookie in the app first.");
    return;
  }
  const stored = JSON.parse(fs.readFileSync(CF_COOKIE_FILE, "utf-8"));
  const cookieHeader: string = stored.cookieHeader
    || (stored.cfClearance ? `cf_clearance=${stored.cfClearance}` : "");

  if (!cookieHeader) { console.error("No cookie data in .cf-clearance.json"); return; }

  const cookies = parseCookieHeader(cookieHeader);
  console.log("Cookie count:", cookies.length);
  console.log("Cookie names:", cookies.map((c: PCookie) => c.name).join(", "));

  const { chromium } = await import("playwright");
  const executablePath = fs.existsSync(CHROME_PATH) ? CHROME_PATH : undefined;
  console.log("\nLaunching", executablePath ? "system Chrome" : "Chromium", "(stealth + visible window)...");

  const browser = await chromium.launch({
    headless: false,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1280,800"],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "en-US",
    viewport: { width: 1280, height: 800 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // @ts-ignore
    window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
  });

  if (cookies.length > 0) await context.addCookies(cookies);

  const page = await context.newPage();

  console.log("\nNavigating to https://daleel-madani.org/calls-for-proposal ...");
  const response = await page.goto("https://daleel-madani.org/calls-for-proposal", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });

  console.log("HTTP status:", response?.status());
  console.log("Polling for Turnstile to clear (up to 20s)...");

  let html = await page.content();
  for (let i = 0; i < 20; i++) {
    const blocked = html.includes("Just a moment") || html.includes("Performing security verification") || html.includes("challenge-platform");
    if (!blocked) break;
    await new Promise(r => setTimeout(r, 1000));
    html = await page.content();
    process.stdout.write(`  ${i + 1}s...`);
  }
  console.log();
  const title = await page.title();
  console.log("Page title:", title);
  console.log("HTML length:", html.length, "bytes");
  const blocked = html.includes("Just a moment") || html.includes("Performing security verification") || html.includes("challenge-platform");
  console.log("Is Cloudflare blocked:", blocked ? "YES ✗" : "NO ✓");

  fs.writeFileSync("/tmp/daleel-debug.html", html);
  console.log("Full HTML saved to: /tmp/daleel-debug.html\n");

  if (!blocked) {
    const $ = cheerio.load(html);
    console.log(".views-row count:", $(".views-row").length);
    console.log("article count:", $("article").length);
    console.log("h2 a count:", $("h2 a").length);

    const interesting = new Set<string>();
    $("[class]").each((_, el) => {
      ($(el).attr("class") || "").split(/\s+/).forEach((c) => {
        if (/view|node|field|call|title|content|list|item|row/i.test(c)) interesting.add(c);
      });
    });
    console.log("\nCSS classes:", Array.from(interesting).slice(0, 30).join(", "));
    console.log("\n--- First 2000 chars of <body> ---");
    console.log($("body").html()?.substring(0, 2000));
  } else {
    console.log("\n--- CF challenge body snippet ---");
    console.log(html.substring(0, 1000));
  }

  await browser.close();
}

debug().catch(console.error);
