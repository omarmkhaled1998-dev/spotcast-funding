export const dynamic = "force-dynamic";

import { Pool } from "pg";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxsYzumeMn-A_s-SEB2U5zfCknXLMOZoww8eWeIYC7XgJc_jjSZJQ5Muk3F3eXZXEPk5A/exec";

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

async function ensureTable(client: import("pg").PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS shumul_registrations (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string> & {
      type: "institution" | "student";
    };

    if (!body.type || !body.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save to Neon DB (primary — always reliable)
    const pg = getPool();
    const client = await pg.connect();
    try {
      await ensureTable(client);
      await client.query(
        "INSERT INTO shumul_registrations (type, data) VALUES ($1, $2)",
        [body.type, JSON.stringify(body)]
      );
      console.log("[initiatives/register] Saved to DB:", body.email);
    } finally {
      client.release();
    }

    // Fire-and-forget: notify via Apps Script (best effort)
    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "manual",
    })
      .then((r) => console.log("[initiatives/register] Apps Script status:", r.status))
      .catch((e) => console.warn("[initiatives/register] Apps Script failed:", e.message));

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[initiatives/register]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
