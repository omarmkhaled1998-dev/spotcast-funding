export const dynamic = "force-dynamic";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxsYzumeMn-A_s-SEB2U5zfCknXLMOZoww8eWeIYC7XgJc_jjSZJQ5Muk3F3eXZXEPk5A/exec";

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, string> & { type: "institution" | "student" };

    if (!body.type || !body.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.text();
    console.log("[initiatives/register] Apps Script response:", result);

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[initiatives/register]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
