import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

const NOTIFY_EMAILS = [
  { name: "Omar Khaled", address: "Omar.khaled@spotcast.press" },
  { name: "Bashir AlRifaii", address: "alrifaibashir66@gmail.com" },
];

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

function buildHtml(type: "institution" | "student", data: Record<string, string>) {
  const isInstitution = type === "institution";
  const icon = isInstitution ? "🏢" : "🎓";
  const title = isInstitution ? "New Institution Registration" : "New Student Application";

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:linear-gradient(135deg,#5E7349,#3A4A2C);padding:24px 32px;border-radius:12px 12px 0 0">
    <h2 style="color:#FBF7EE;margin:0;font-size:20px">${icon} ${title}</h2>
    <p style="color:rgba(251,247,238,0.75);margin:6px 0 0;font-size:13px">Shumul Institutional Development Initiative</p>
  </div>
  <div style="background:#F8F3E8;padding:24px 32px;border:1px solid #d9d1c0;border-top:none;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse">
      ${Object.entries(data).map(([k, v]) => `
        <tr style="border-bottom:1px solid rgba(31,26,20,0.07)">
          <td style="padding:10px 0;font-size:11px;color:#6B6258;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;width:38%;vertical-align:top">${k}</td>
          <td style="padding:10px 0;font-size:13px;color:#1F1A14;vertical-align:top">${v || "—"}</td>
        </tr>
      `).join("")}
    </table>
  </div>
  <p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:12px">
    Shumul Initiative · SpotCast · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
  </p>
</div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, string> & { type: "institution" | "student" };
    const { type, ...fields } = body;

    if (!type || !fields.email) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("[initiatives/register] SMTP not configured. Set SMTP_USER and SMTP_PASS in Vercel env vars. Data received:", JSON.stringify(body));
      return Response.json({ ok: true });
    }

    const isInstitution = type === "institution";
    const subject = isInstitution
      ? `[Shumul] New Institution: ${fields.orgName}`
      : `[Shumul] New Student: ${fields.fullName}`;

    const emailData: Record<string, string> = isInstitution ? {
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

    const html = buildHtml(type, emailData);
    const transport = getTransport();

    // Send a separate email to each recipient
    await Promise.all(
      NOTIFY_EMAILS.map(({ address }) =>
        transport.sendMail({
          from: `"Shumul Initiative" <${process.env.SMTP_USER}>`,
          to: address,
          replyTo: fields.email,
          subject,
          html,
        })
      )
    );

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[initiatives/register]", err);
    return Response.json({ error: "Failed to send" }, { status: 500 });
  }
}
