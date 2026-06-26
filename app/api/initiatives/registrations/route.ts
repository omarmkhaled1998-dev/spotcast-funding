export const dynamic = "force-dynamic";

import { Pool } from "pg";

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  return pool;
}

// Simple token guard — add ?token=shumul2026 to the URL
const ADMIN_TOKEN = "shumul2026";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== ADMIN_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pg = getPool();
    const client = await pg.connect();
    try {
      const result = await client.query(
        "SELECT id, type, data, created_at FROM shumul_registrations ORDER BY created_at DESC"
      );
      return Response.json({ count: result.rowCount, registrations: result.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
