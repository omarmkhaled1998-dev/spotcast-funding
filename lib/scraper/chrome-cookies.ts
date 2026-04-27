/**
 * Reads cookies for a given domain from the user's Chrome browser on macOS.
 * Copies the (locked) SQLite file to /tmp first, then decrypts with the
 * Chrome Safe Storage key from macOS Keychain.
 */

import { execSync } from "child_process";
import { createDecipheriv, pbkdf2Sync } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Database = require("better-sqlite3");

const CHROME_COOKIES_PATH = path.join(
  os.homedir(),
  "Library/Application Support/Google/Chrome/Default/Cookies"
);

const CHROME_COOKIES_NETWORK_PATH = path.join(
  os.homedir(),
  "Library/Application Support/Google/Chrome/Default/Network/Cookies"
);

function getChromeSafeStorageKey(): Buffer {
  // Read Chrome Safe Storage password from macOS Keychain
  const password = execSync(
    'security find-generic-password -w -s "Chrome Safe Storage"',
    { encoding: "utf-8" }
  ).trim();

  // Derive encryption key: PBKDF2-SHA1, salt="saltysalt", 1003 iterations, 16 bytes
  return pbkdf2Sync(password, "saltysalt", 1003, 16, "sha1");
}

function decryptCookieValue(encrypted: Buffer, key: Buffer): string {
  if (!encrypted || encrypted.length === 0) return "";

  // macOS Chrome prefixes encrypted cookies with "v10" or "v11"
  const prefix = encrypted.slice(0, 3).toString();
  if (prefix !== "v10" && prefix !== "v11") {
    // Not encrypted — return raw string
    return encrypted.toString("utf-8");
  }

  const ciphertext = encrypted.slice(3); // skip "v10"/"v11"
  const iv = Buffer.alloc(16, " "); // 16 spaces

  try {
    const decipher = createDecipheriv("aes-128-cbc", key, iv);
    decipher.setAutoPadding(true);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf-8");
  } catch {
    return "";
  }
}

export async function getCookiesForDomain(domain: string): Promise<Record<string, string>> {
  // Find cookie file
  const cookiesPath = fs.existsSync(CHROME_COOKIES_NETWORK_PATH)
    ? CHROME_COOKIES_NETWORK_PATH
    : CHROME_COOKIES_PATH;

  if (!fs.existsSync(cookiesPath)) {
    throw new Error(`Chrome cookies file not found at ${cookiesPath}`);
  }

  // Copy to /tmp (Chrome locks the original while running)
  const tmpPath = path.join(os.tmpdir(), `chrome-cookies-${Date.now()}.db`);
  fs.copyFileSync(cookiesPath, tmpPath);

  let key: Buffer;
  try {
    key = getChromeSafeStorageKey();
  } catch {
    // If Keychain access fails, try without decryption
    key = Buffer.alloc(16);
  }

  const cookies: Record<string, string> = {};

  try {
    const db = new Database(tmpPath, { readonly: true });

    // Chrome's cookie table schema: host_key, name, encrypted_value, value
    const rows = db.prepare(`
      SELECT name, encrypted_value, value, host_key
      FROM cookies
      WHERE host_key LIKE ?
        OR host_key LIKE ?
    `).all(`%${domain}%`, `.${domain}`) as Array<{
      name: string;
      encrypted_value: Buffer;
      value: string;
      host_key: string;
    }>;

    for (const row of rows) {
      let val = row.value || "";
      if (row.encrypted_value && row.encrypted_value.length > 0) {
        val = decryptCookieValue(row.encrypted_value, key) || val;
      }
      if (val) cookies[row.name] = val;
    }

    db.close();
  } finally {
    try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
  }

  return cookies;
}

export function cookiesToHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}
