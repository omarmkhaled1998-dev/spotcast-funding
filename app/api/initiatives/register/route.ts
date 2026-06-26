export const dynamic = "force-dynamic";

import { neon } from "@neondatabase/serverless";

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxsYzumeMn-A_s-SEB2U5zfCknXLMOZoww8eWeIYC7XgJc_jjSZJQ5Muk3F3eXZXEPk5A/exec";

function getDb() {
  return neon(process.env.DATABASE_URL!);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string> & {
      type: "institution" | "student" | "contact";
    };

    if (!body.type || !body.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      CREATE TABLE IF NOT EXISTS shumul_registrations (
        id        SERIAL PRIMARY KEY,
        type      TEXT        NOT NULL,
        data      JSONB       NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO shumul_registrations (type, data)
      VALUES (${body.type}, ${JSON.stringify(body)})
    `;

    console.log("[initiatives/register] Saved to DB:", body.email);

    // Fire-and-forget notification (best effort)
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
