export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

const ADMIN_TOKEN = "shumul2026";

async function ensureTable() {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS shumul_registrations (
      id         SERIAL PRIMARY KEY,
      type       TEXT        NOT NULL,
      data       JSONB       NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== ADMIN_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable();

    const rows = await db.$queryRaw<
      { id: number; type: string; data: Record<string, string>; created_at: Date }[]
    >`
      SELECT id, type, data, created_at
      FROM shumul_registrations
      ORDER BY created_at DESC
    `;

    return Response.json({ count: rows.length, registrations: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
