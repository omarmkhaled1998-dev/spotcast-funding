export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxsYzumeMn-A_s-SEB2U5zfCknXLMOZoww8eWeIYC7XgJc_jjSZJQ5Muk3F3eXZXEPk5A/exec";

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string> & {
      type: "institution" | "student" | "contact";
    };

    if (!body.type || !body.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    await ensureTable();
    await db.$executeRaw`
      INSERT INTO shumul_registrations (type, data)
      VALUES (${body.type}, ${JSON.stringify(body)}::jsonb)
    `;

    console.log("[initiatives/register] Saved:", body.email, body.type);

    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "manual",
    }).catch(() => {});

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[initiatives/register]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
