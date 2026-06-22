import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const NOTIFY_EMAILS = ["Omar.khaled@spotcast.press", "alrifaibashir66@gmail.com"];

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function institutionHtml(data: Record<string, string>) {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#7a1f35,#C4607A);padding:24px 32px;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">🏢 New Institution Registration</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Shumul Institutional Development Initiative</p>
  </div>
  <div style="background:#f9f9f9;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse">
      ${Object.entries(data).map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-weight:600;width:40%;vertical-align:top">${k}</td>
          <td style="padding:8px 0;font-size:13px;color:#1a1a2e;vertical-align:top">${v || "—"}</td>
        </tr>
      `).join("")}
    </table>
  </div>
  <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:12px">Shumul Initiative · SpotCast · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
</div>`;
}

function studentHtml(data: Record<string, string>) {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#7a1f35,#C4607A);padding:24px 32px;border-radius:12px 12px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">🎓 New Student Application</h2>
    <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:13px">Shumul Institutional Development Initiative</p>
  </div>
  <div style="background:#f9f9f9;padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse">
      ${Object.entries(data).map(([k, v]) => `
        <tr>
          <td style="padding:8px 0;font-size:12px;color:#6b7280;font-weight:600;width:40%;vertical-align:top">${k}</td>
          <td style="padding:8px 0;font-size:13px;color:#1a1a2e;vertical-align:top">${v || "—"}</td>
        </tr>
      `).join("")}
    </table>
  </div>
  <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:12px">Shumul Initiative · SpotCast · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
</div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, string> & { type: "institution" | "student" };
    const { type, ...fields } = body;

    if (!type || !fields.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If SMTP is not configured, just return success (form still works visually)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("[initiatives/register] SMTP not configured — skipping email. Data:", body);
      return Response.json({ ok: true });
    }

    const transport = getTransport();
    const isInstitution = type === "institution";

    const emailData = isInstitution ? {
      "Organization Name": fields.orgName,
      "Type": fields.orgType,
      "Location": fields.location,
      "Team Size": fields.teamSize,
      "Challenges": fields.challenges,
      "Description": fields.description,
      "Contact Name": fields.contactName,
      "Email": fields.email,
      "Phone": fields.phone,
    } : {
      "Full Name": fields.fullName,
      "University": fields.university,
      "Faculty / Major": fields.faculty,
      "Year": fields.year,
      "Email": fields.email,
      "Phone": fields.phone,
      "Motivation": fields.motivation,
    };

    await transport.sendMail({
      from: `"Shumul Initiative" <${process.env.SMTP_USER}>`,
      to: NOTIFY_EMAILS.join(", "),
      replyTo: fields.email,
      subject: isInstitution
        ? `[Shumul] New Institution: ${fields.orgName}`
        : `[Shumul] New Student: ${fields.fullName}`,
      html: isInstitution ? institutionHtml(emailData) : studentHtml(emailData),
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[initiatives/register]", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
