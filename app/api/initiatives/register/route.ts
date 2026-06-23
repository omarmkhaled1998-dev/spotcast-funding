export const dynamic = "force-dynamic";

const NOTIFY_EMAILS = [
  "Omar.khaled@spotcast.press",
  "alrifaibashir66@gmail.com",
];

function buildHtml(type: "institution" | "student", data: Record<string, string>) {
  const isInstitution = type === "institution";
  const icon = isInstitution ? "🏢" : "🎓";
  const title = isInstitution ? "New Institution Registration" : "New Student Application";

  const rows = Object.entries(data)
    .map(([k, v]) => `
      <tr style="border-bottom:1px solid rgba(31,26,20,0.07)">
        <td style="padding:10px 0;font-size:11px;color:#6B6258;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;width:38%;vertical-align:top">${k}</td>
        <td style="padding:10px 0;font-size:13px;color:#1F1A14;vertical-align:top">${v || "—"}</td>
      </tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:20px;background:#f0ebe0">
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#5E7349,#3A4A2C);padding:28px 32px;border-radius:12px 12px 0 0">
    <div style="font-size:28px;margin-bottom:8px">${icon}</div>
    <h2 style="color:#FBF7EE;margin:0;font-size:22px;font-weight:700">${title}</h2>
    <p style="color:rgba(251,247,238,0.7);margin:6px 0 0;font-size:13px">Shumul Institutional Development Initiative · Akkar & North Lebanon</p>
  </div>
  <div style="background:#F8F3E8;padding:24px 32px;border:1px solid #d9d1c0;border-top:none;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse">
      ${rows}
    </table>
    <div style="margin-top:20px;padding:14px 18px;background:#FBF7EE;border-radius:6px;border:1px solid rgba(74,92,57,0.2)">
      <p style="margin:0;font-size:12px;color:#4A5C39;font-weight:600">Reply directly to this email to contact the applicant.</p>
    </div>
  </div>
  <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:16px">
    Shumul Initiative · SpotCast · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
  </p>
</div>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string, replyTo: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Shumul Initiative <onboarding@resend.dev>",
      to: [to],
      reply_to: replyTo,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, string> & { type: "institution" | "student" };
    const { type, ...fields } = body;

    if (!type || !fields.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("[initiatives/register] RESEND_API_KEY not set — email skipped. Payload:", JSON.stringify(body));
      return Response.json({ ok: true });
    }

    const isInstitution = type === "institution";
    const subject = isInstitution
      ? `[Shumul] New Institution: ${fields.orgName}`
      : `[Shumul] New Student: ${fields.fullName}`;

    const emailData: Record<string, string> = isInstitution ? {
      "Organization Name":  fields.orgName,
      "Type":               fields.orgType,
      "Location":           fields.location,
      "Team Size":          fields.teamSize,
      "Primary Challenge":  fields.challenges,
      "Description":        fields.description,
      "Contact Name":       fields.contactName,
      "Email":              fields.email,
      "Phone":              fields.phone,
    } : {
      "Full Name":          fields.fullName,
      "University":         fields.university,
      "Faculty / Major":    fields.faculty,
      "Year":               fields.year,
      "Email":              fields.email,
      "Phone":              fields.phone,
      "Motivation":         fields.motivation,
    };

    const html = buildHtml(type, emailData);

    // Send a separate email to each recipient
    await Promise.all(
      NOTIFY_EMAILS.map(address =>
        sendViaResend(address, subject, html, fields.email)
      )
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[initiatives/register]", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
