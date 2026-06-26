export const dynamic = "force-dynamic";

const RESEND_KEY = "re_QXa1LfDK_8AxQHWwzsMXqYLPk1N7bnRwo";
const RECIPIENTS = ["omar.m.khaled1998@gmail.com", "alrifaibashir66@gmail.com"];

function buildEmail(body: Record<string, string>) {
  const typeLabel =
    body.type === "institution" ? "مؤسسة" :
    body.type === "student"     ? "طالب" :
                                  "تواصل";

  const rows = Object.entries(body)
    .filter(([k]) => k !== "type")
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:600;color:#4A5C39;border-bottom:1px solid #eee;">${k}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${v}</td></tr>`)
    .join("");

  return {
    subject: `[شمول] طلب جديد — ${typeLabel}: ${body.email}`,
    html: `
<div dir="rtl" style="font-family:'Cairo',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F8F3E8;border-radius:8px;">
  <div style="background:#3A4A2C;color:#FBF7EE;padding:20px 24px;border-radius:6px 6px 0 0;">
    <h2 style="margin:0;font-size:20px;">طلب جديد — ${typeLabel}</h2>
    <p style="margin:4px 0 0;opacity:.7;font-size:13px;">مبادرة شمول · shumul.org</p>
  </div>
  <div style="background:#fff;border:1px solid #e9dfce;border-top:none;border-radius:0 0 6px 6px;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
  </div>
  <p style="margin:16px 0 0;font-size:12px;color:#6B6258;text-align:center;">
    عرض كل الطلبات: <a href="https://shumul.org/api/initiatives/registrations?token=shumul2026" style="color:#4A5C39;">رابط الأدمن</a>
  </p>
</div>`,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string> & {
      type: "institution" | "student" | "contact";
    };

    if (!body.type || !body.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 1. Try DB storage (best-effort, won't block success) ─────────
    try {
      const { db } = await import("@/lib/db");
      await db.$executeRaw`
        CREATE TABLE IF NOT EXISTS shumul_registrations (
          id         SERIAL PRIMARY KEY,
          type       TEXT        NOT NULL,
          data       JSONB       NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await db.$executeRaw`
        INSERT INTO shumul_registrations (type, data)
        VALUES (${body.type}, ${JSON.stringify(body)}::jsonb)
      `;
      console.log("[register] Saved to DB:", body.email);
    } catch (dbErr) {
      console.warn("[register] DB skipped:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    // ── 2. Send email via Resend (primary notification) ──────────────
    const { subject, html } = buildEmail(body);
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "مبادرة شمول <noreply@shumul.org>",
        to: RECIPIENTS,
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error("[register] Resend error:", err);
    } else {
      console.log("[register] Email sent to", RECIPIENTS.join(", "));
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[initiatives/register]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
