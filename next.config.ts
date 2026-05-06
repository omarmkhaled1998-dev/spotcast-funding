import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // instrumentation.ts is enabled by default in Next.js 15
  serverExternalPackages: [
    // node-cron must not be bundled
    "node-cron",
    // Playwright and stealth plugin are Node.js-only and must not be bundled
    "playwright",
    "playwright-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra",
    // pg driver — also Node.js native
    "pg",
    "pg-native",
    // Anthropic SDK uses Node.js streams
    "@anthropic-ai/sdk",
    // officeparser reads files from disk — must not be bundled
    "officeparser",
  ],
};

export default nextConfig;
