import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
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
