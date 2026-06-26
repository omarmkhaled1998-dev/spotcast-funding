"use client";

import { useState } from "react";
import Link from "next/link";
import { ShumulLogo } from "@/components/hub/ShumulLogo";
import { ShumulTopNav } from "@/components/shumul/ShumulTopNav";

/* ─── Tokens ─────────────────────────────────────────────── */
const OLIVE   = "#4A5C39";
const OLIVE_D = "#3A4A2C";
const OLIVE_L = "#7A8F5E";
const TERRA   = "#C76B4A";
const TERRA_D = "#B05839";
const BG      = "#F8F3E8";
const BG_ALT  = "#F1E9DA";
const BG_DEEP = "#E9DFCE";
const SURFACE = "#FBF7EE";
const INK     = "#1F1A14";
const INK_B   = "#3D362F";
const INK_M   = "#6B6258";
const ON_DARK = "#FBF7EE";
const RULE    = "rgba(31,26,20,0.12)";
const RULE_S  = "rgba(31,26,20,0.06)";
const RULE_D  = "rgba(248,243,232,0.18)";

const FONT_H = "var(--font-barlow-condensed),'Barlow Condensed',sans-serif";
const FONT_B = "var(--font-barlow),'Barlow',sans-serif";

/* ─── Content ────────────────────────────────────────────── */
const PROGRAMS = [
  { num: "01", title: "Social & Humanitarian Support", body: "Initiatives for the most vulnerable in Akkar: targeted assistance, referrals, and social accompaniment." },
  { num: "02", title: "Youth Empowerment", body: "Training in leadership, life skills, and community media — and pathways into local decision-making." },
  { num: "03", title: "Women's Empowerment & Protection", body: "Educational and economic programs, and safe spaces for dialogue and protection from gender-based violence." },
  { num: "04", title: "Safe Spaces & Dialogue", body: "Conversations across groups and generations to address tensions and build shared understanding." },
  { num: "05", title: "Culture & Community", body: "Cultural activities, cinema, reading, and gatherings that connect people to local identity and arts." },
  { num: "06", title: "Volunteering & Local Initiatives", body: "A network of volunteers running small, fast, real-need initiatives in their towns." },
];

const STATS = [
  { num: "33+", label: "members and volunteers in our community network" },
  { num: "40+", label: "activities and local initiatives since founding" },
  { num: "12",  label: "partnerships with local and international institutions" },
  { num: "7",   label: "towns and villages in Akkar and North Lebanon" },
];

const VALUES = [
  { title: "Dignity",       body: "Human dignity sits at the core of every initiative. We refuse any form of paternalism." },
  { title: "Solidarity",    body: "Community work begins with the neighbor and grows to include everyone." },
  { title: "Participation", body: "We don't work for people. We work with them. Decisions are shared. The path is collective." },
];

const PROJECTS = [
  { tag: "Club",     title: "Shumul Cultural Club",       body: "A weekly space for cinema, reading, and cultural conversation with local youth.",              bg: OLIVE_D  },
  { tag: "Club",     title: "Shumul Social Club",         body: "A space for meeting, exchanging skills, and collective work on local issues.",                  bg: TERRA    },
  { tag: "Dialogue", title: "Community Support Sessions", body: "Listening and dialogue circles for women and youth around everyday issues.",                    bg: OLIVE_L  },
  { tag: "Youth",    title: "Youth-Led Initiatives",      body: "Supporting initiatives led by young people in their own villages and neighborhoods.",           bg: "#5E7349" },
  { tag: "Campaign", title: "Awareness Campaigns",        body: "Health, rights, and civic participation campaigns across Akkar and North Lebanon.",             bg: TERRA_D  },
];

const BULLETS = ["Social & humanitarian support", "Cultural & dialogue activities", "On-the-ground awareness campaigns", "Community content production"];

/* ─── Helpers ─────────────────────────────────────────────── */
function Eyebrow({ label, onDark }: { label: string; onDark?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: FONT_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: onDark ? "#D88A6E" : OLIVE, textTransform: "uppercase" as const }}>
      <span style={{ width: 28, height: 1.5, background: "currentColor", display: "inline-block", flexShrink: 0 }} />
      {label}
    </div>
  );
}

function Section({ children, bg, tight, id }: { children: React.ReactNode; bg?: string; tight?: boolean; id?: string }) {
  return (
    <section id={id} style={{ background: bg || BG, paddingBlock: tight ? "72px" : "96px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}>
        {children}
      </div>
    </section>
  );
}

/* ─── Contact form ─────────────────────────────────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      await fetch("/api/initiatives/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contact", ...form }),
      });
    } catch {}
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ width: 56, height: 56, borderRadius: 4, background: BG_ALT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 24, color: OLIVE }}>✓</div>
        <h3 style={{ fontFamily: FONT_H, fontSize: 22, fontWeight: 700, color: INK, marginBottom: 8 }}>Message received</h3>
        <p style={{ fontFamily: FONT_B, fontSize: 15, color: INK_M, marginBottom: 24 }}>We'll be in touch soon. Thanks for reaching out to Shumul.</p>
        <button onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
          style={{ fontFamily: FONT_B, fontSize: 14, fontWeight: 600, color: OLIVE, background: "transparent", border: `1px solid ${OLIVE}`, borderRadius: 2, padding: "10px 24px", cursor: "pointer" }}>
          Send another message
        </button>
      </div>
    );
  }

  const inputStyle = { width: "100%", padding: "12px 14px", border: `1px solid ${RULE}`, borderRadius: 3, background: SURFACE, color: INK, fontFamily: FONT_B, fontSize: 14, outline: "none", boxSizing: "border-box" as const };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <div className="sh-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>Name *</label>
          <input value={form.name} onChange={set("name")} required placeholder="Your full name" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>Email *</label>
          <input type="email" value={form.email} onChange={set("email")} required placeholder="name@example.com" style={inputStyle} />
        </div>
      </div>
      <div className="sh-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>Phone</label>
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+961 …" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>Subject</label>
          <input value={form.subject} onChange={set("subject")} placeholder="Volunteer, partnership, enquiry…" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontFamily: FONT_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>Message *</label>
        <textarea value={form.message} onChange={set("message")} required placeholder="Write to us…" rows={5}
          style={{ ...inputStyle, resize: "vertical" as const, minHeight: 120 }} />
      </div>
      <button type="submit" disabled={status === "sending"}
        style={{ alignSelf: "flex-start", fontFamily: FONT_B, fontSize: 15, fontWeight: 700, color: ON_DARK, background: status === "sending" ? OLIVE_L : OLIVE, border: "none", borderRadius: 2, padding: "14px 32px", cursor: "pointer" }}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function ShumulHomeEN() {
  return (
    <div style={{ background: BG, color: INK, fontFamily: FONT_B }} dir="ltr">

      <style>{`
  .sh-2col { display: grid; }
  .sh-3col { display: grid; }
  .sh-4col { display: grid; }
  .sh-form-row { display: grid; }
  @media (max-width: 860px) {
    .sh-2col { grid-template-columns: 1fr !important; gap: 32px !important; }
    .sh-3col { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
    .sh-4col { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
    .sh-form-row { grid-template-columns: 1fr !important; }
    .sh-nav-links { display: none !important; }
  }
  @media (max-width: 540px) {
    .sh-3col { grid-template-columns: 1fr !important; }
  }
`}</style>

      {/* ── Top nav ── */}
      <ShumulTopNav />

      {/* ── Sticky page header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(248,243,232,0.96)", backdropFilter: "saturate(140%) blur(12px)", WebkitBackdropFilter: "saturate(140%) blur(12px)", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShumulLogo size={36} variant="light" />
            <div>
              <p style={{ fontFamily: FONT_H, fontSize: 20, fontWeight: 800, color: OLIVE_D, margin: 0, lineHeight: 1.2, letterSpacing: "0.02em" }}>Shumul</p>
              <p style={{ fontFamily: FONT_B, fontSize: 11, color: INK_M, margin: 0 }}>Foundation · Akkar, North Lebanon</p>
            </div>
          </div>
          <div className="sh-nav-links" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[["#about", "About"], ["#programs", "Programs"], ["#contact", "Contact"]].map(([href, label]) => (
              <a key={href} href={href} style={{ fontFamily: FONT_B, fontSize: 13, fontWeight: 500, color: INK_M, textDecoration: "none" }}>{label}</a>
            ))}
            <Link href="/"
              style={{ fontFamily: FONT_B, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: INK_M, border: `1px solid ${RULE}`, borderRadius: 999, padding: "5px 12px", textDecoration: "none" }}>
              AR
            </Link>
            <a href="#contact" style={{ fontFamily: FONT_B, fontSize: 13, fontWeight: 700, color: ON_DARK, background: OLIVE, borderRadius: 2, padding: "8px 20px", textDecoration: "none" }}>Support us</a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        position: "relative", overflow: "hidden", minHeight: "88vh",
        background: "radial-gradient(ellipse at 30% 20%, rgba(122,143,94,0.45), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(58,74,44,0.55), transparent 60%), linear-gradient(135deg, #5E7349 0%, #3A4A2C 100%)",
        display: "flex", alignItems: "center", padding: "80px clamp(20px,4vw,56px)",
      }}>
        {/* Grain */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.5, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
        {/* Watermark */}
        <div style={{ position: "absolute", right: "-0.05em", bottom: "-0.12em", fontFamily: FONT_H, fontWeight: 900, fontSize: "clamp(160px,28vw,380px)", color: "rgba(248,243,232,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none", letterSpacing: "-0.03em" }}>SHUMUL</div>

        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <Eyebrow label="Social & Humanitarian Foundation · Akkar, North Lebanon" onDark />
          </div>
          <h1 style={{ fontFamily: FONT_H, fontWeight: 900, fontSize: "clamp(44px,7vw,96px)", color: ON_DARK, lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 24px" }}>
            Space for people,<br />for support,<br />for a life of dignity.
          </h1>
          <p style={{ fontFamily: FONT_B, fontSize: "clamp(15px,1.4vw,18px)", color: "rgba(248,243,232,0.82)", lineHeight: 1.9, maxWidth: 560, marginBottom: 40 }}>
            A social and humanitarian foundation working in Akkar and North Lebanon to support marginalized communities, empower youth and women, and create safe spaces for dialogue and collective action.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginBottom: 56 }}>
            <a href="#about" style={{ fontFamily: FONT_B, fontSize: 15, fontWeight: 700, color: OLIVE_D, background: ON_DARK, borderRadius: 2, padding: "14px 28px", textDecoration: "none" }}>Learn about us</a>
            <a href="#volunteer" style={{ fontFamily: FONT_B, fontSize: 15, fontWeight: 600, color: ON_DARK, background: "transparent", border: "1px solid rgba(248,243,232,0.4)", borderRadius: 2, padding: "14px 28px", textDecoration: "none" }}>Volunteer with us</a>
          </div>
          {/* Meta strip */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 24, paddingTop: 24, borderTop: `1px solid ${RULE_D}` }}>
            {[["Founded", "2024"], ["Region", "Akkar"], ["Network", "33+ members"], ["Initiatives", "40+ activities"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FONT_B, fontSize: 11, color: "rgba(248,243,232,0.5)", letterSpacing: "0.06em" }}>{l}</span>
                <span style={{ fontFamily: FONT_H, fontSize: 14, fontWeight: 700, color: "rgba(248,243,232,0.9)", letterSpacing: "0.02em" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <Section bg={SURFACE} tight>
        <div id="about" className="sh-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,96px)", alignItems: "start" }}>
          <div>
            <div style={{ marginBottom: 20 }}><Eyebrow label="Who we are" /></div>
            <h2 style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(30px,4vw,54px)", color: INK, lineHeight: 1.15, letterSpacing: "-0.01em", margin: "0 0 24px" }}>
              We start by listening,<br />and finish by acting.
            </h2>
            <p style={{ fontFamily: FONT_B, fontSize: 16, color: INK_B, lineHeight: 1.9, marginBottom: 0 }}>
              Shumul Foundation is a social and humanitarian organization born from years of grassroots community work in Akkar. We focus on social support, humanitarian initiatives, youth and women's empowerment, and cultural and social activities that strengthen local solidarity.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, paddingTop: 8 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background: BG_ALT, borderRadius: 4, padding: "24px 28px", borderLeft: `3px solid ${TERRA}` }}>
                <h3 style={{ fontFamily: FONT_H, fontSize: 18, fontWeight: 700, color: INK, margin: "0 0 8px", letterSpacing: "0.02em" }}>{v.title}</h3>
                <p style={{ fontFamily: FONT_B, fontSize: 14, color: INK_M, lineHeight: 1.85, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Programs ── */}
      <Section bg={BG} id="programs">
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}><Eyebrow label="Our programs" /></div>
          <h2 style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(32px,4vw,60px)", color: INK, margin: "0 0 16px", letterSpacing: "-0.01em" }}>What we do.</h2>
          <p style={{ fontFamily: FONT_B, fontSize: 16, color: INK_M, lineHeight: 1.85, maxWidth: 560, margin: 0 }}>
            Six interlocking program areas covering the social, cultural, and humanitarian needs of the region.
          </p>
        </div>
        <div className="sh-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(16px,2vw,24px)" }}>
          {PROGRAMS.map(p => (
            <div key={p.num} style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 4, padding: "clamp(20px,2.4vw,28px)", transition: "transform 220ms, box-shadow 220ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(31,26,20,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              <div style={{ fontFamily: FONT_H, fontSize: 13, fontWeight: 700, color: TERRA, letterSpacing: "0.04em", marginBottom: 12 }}>{p.num}</div>
              <h3 style={{ fontFamily: FONT_H, fontSize: 18, fontWeight: 700, color: INK, margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "0.01em" }}>{p.title}</h3>
              <p style={{ fontFamily: FONT_B, fontSize: 14, color: INK_M, lineHeight: 1.85, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Impact stats ── */}
      <section style={{ background: OLIVE_D, padding: "96px clamp(20px,4vw,56px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.4, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 16 }}><Eyebrow label="Our impact starts with people" onDark /></div>
          <h2 style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(32px,4vw,60px)", color: ON_DARK, margin: "0 0 12px", letterSpacing: "-0.01em" }}>Small numbers. Real presence.</h2>
          <p style={{ fontFamily: FONT_B, fontSize: 16, color: "rgba(248,243,232,0.72)", lineHeight: 1.9, maxWidth: 560, marginBottom: 64 }}>
            We're not a large organization, and we don't want to be. We are a local network working steadily in a region that rarely makes headlines.
          </p>
          <div className="sh-4col" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(24px,3vw,48px)" }}>
            {STATS.map(s => (
              <div key={s.num}>
                <span style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(52px,6vw,84px)", color: TERRA, lineHeight: 0.95, letterSpacing: "-0.02em", display: "block" }}>{s.num}</span>
                <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.72)", lineHeight: 1.7, marginTop: 12 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <Section bg={BG_ALT}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}><Eyebrow label="Projects & initiatives" /></div>
          <h2 style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(32px,4vw,60px)", color: INK, margin: 0, letterSpacing: "-0.01em" }}>From idea to ground.</h2>
        </div>
        <div className="sh-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(16px,2vw,24px)" }}>
          {PROJECTS.map(p => (
            <div key={p.title} style={{ background: p.bg, borderRadius: 4, padding: "clamp(24px,2.4vw,32px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.4, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: FONT_B, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(248,243,232,0.55)", marginBottom: 12, textTransform: "uppercase" as const }}>{p.tag}</div>
                <h3 style={{ fontFamily: FONT_H, fontSize: 20, fontWeight: 700, color: ON_DARK, margin: "0 0 10px", lineHeight: 1.25, letterSpacing: "0.01em" }}>{p.title}</h3>
                <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.78)", lineHeight: 1.85, margin: 0 }}>{p.body}</p>
              </div>
            </div>
          ))}
          {/* CTA card */}
          <div style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 4, padding: "clamp(24px,2.4vw,32px)", display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
            <h3 style={{ fontFamily: FONT_H, fontSize: 20, fontWeight: 700, color: INK, margin: "0 0 10px", letterSpacing: "0.01em" }}>Have an initiative idea?</h3>
            <p style={{ fontFamily: FONT_B, fontSize: 14, color: INK_M, lineHeight: 1.85, margin: "0 0 20px" }}>We support small, local initiatives. Talk to us.</p>
            <a href="#contact" style={{ fontFamily: FONT_B, fontSize: 14, fontWeight: 700, color: ON_DARK, background: OLIVE, borderRadius: 2, padding: "12px 24px", textDecoration: "none", display: "inline-block", textAlign: "center" as const }}>Get in touch</a>
          </div>
        </div>
      </Section>

      {/* ── Story pull quote ── */}
      <section style={{ background: BG_DEEP, padding: "80px clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}><Eyebrow label="Our approach" /></div>
          <blockquote style={{ borderLeft: `3px solid ${TERRA}`, paddingLeft: "clamp(24px,3vw,40px)", margin: 0 }}>
            <p style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(22px,3vw,38px)", color: INK, lineHeight: 1.35, letterSpacing: "-0.01em", margin: "0 0 16px" }}>
              "A good program isn't written at a desk. It's written on a doorstep, in a village café, and at the edge of a workshop."
            </p>
            <cite style={{ fontFamily: FONT_B, fontSize: 14, color: INK_M, fontStyle: "normal" as const }}>— from a Shumul session</cite>
          </blockquote>
        </div>
      </section>

      {/* ── Volunteer ── */}
      <Section id="volunteer" bg={SURFACE} tight>
        <div id="volunteer" className="sh-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,96px)", alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 16 }}><Eyebrow label="Be part of Shumul" /></div>
            <h2 style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(28px,3.5vw,50px)", color: INK, margin: "0 0 20px", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              We're building this space together.
            </h2>
            <p style={{ fontFamily: FONT_B, fontSize: 16, color: INK_B, lineHeight: 1.9, marginBottom: 32 }}>
              We're always looking for people who believe in community work and want to help build a more supportive and just environment. We don't need experience — we need commitment.
            </p>
            <a href="#contact" style={{ fontFamily: FONT_B, fontSize: 15, fontWeight: 700, color: ON_DARK, background: TERRA, borderRadius: 2, padding: "14px 32px", textDecoration: "none", display: "inline-block" }}>Volunteer with us</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {BULLETS.map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: BG_ALT, borderRadius: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: TERRA, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_B, fontSize: 15, color: INK_B, fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section bg={BG} tight>
        <div id="contact" className="sh-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "clamp(40px,6vw,96px)", alignItems: "start" }}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ marginBottom: 16 }}><Eyebrow label="Contact us" /></div>
            <h2 style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: "clamp(28px,3.5vw,50px)", color: INK, margin: "0 0 16px", letterSpacing: "-0.01em" }}>Talk to us.</h2>
            <p style={{ fontFamily: FONT_B, fontSize: 16, color: INK_B, lineHeight: 1.9, marginBottom: 40 }}>
              Whether you want to volunteer, partner, or share an initiative idea — write to us. We read every message.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {[["Region", "Akkar, North Lebanon"], ["Working days", "Monday – Friday"], ["Email", "info@shumul.org"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: FONT_B, fontSize: 12, fontWeight: 600, color: INK_M, letterSpacing: "0.06em", flexShrink: 0, paddingTop: 2 }}>{l}</span>
                  <span style={{ fontFamily: FONT_B, fontSize: 15, color: INK_B }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 6, padding: "clamp(24px,3vw,40px)" }}>
            <ContactForm />
          </div>
        </div>
      </Section>

      {/* ── Shumul Hub + Initiative Banner ── */}
      <section style={{ background: BG_ALT, padding: "64px clamp(20px,4vw,56px)", borderTop: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p style={{ fontFamily: FONT_H, fontWeight: 800, fontSize: 13, color: OLIVE, letterSpacing: "0.1em", marginBottom: 32, display: "flex", alignItems: "center", gap: 10, textTransform: "uppercase" as const }}>
            <span style={{ width: 28, height: 1.5, background: "currentColor", display: "inline-block" }} />
            Our initiatives
          </p>
          <div className="sh-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <Link href="/initiatives/shumul/en" style={{ background: OLIVE_D, borderRadius: 6, padding: "clamp(28px,3vw,44px)", textDecoration: "none", display: "block", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.4, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: FONT_B, fontSize: 11, letterSpacing: "0.1em", color: "rgba(248,243,232,0.5)", marginBottom: 10, textTransform: "uppercase" as const }}>Initiative</div>
                <h3 style={{ fontFamily: FONT_H, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 700, color: ON_DARK, margin: "0 0 12px", letterSpacing: "0.01em" }}>Shumul Institutional Development Initiative</h3>
                <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.75)", lineHeight: 1.85, margin: "0 0 24px" }}>A free program connecting students with emerging organizations in Akkar and North Lebanon.</p>
                <span style={{ fontFamily: FONT_B, fontSize: 14, fontWeight: 700, color: TERRA + "cc" }}>View the program →</span>
              </div>
            </Link>
            <Link href="/hub" style={{ background: "#0e2334", borderRadius: 6, padding: "clamp(28px,3vw,44px)", textDecoration: "none", display: "block" }}>
              <div style={{ fontFamily: FONT_B, fontSize: 11, letterSpacing: "0.1em", color: "rgba(248,243,232,0.5)", marginBottom: 10, textTransform: "uppercase" as const }}>Project</div>
              <h3 style={{ fontFamily: FONT_H, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 700, color: ON_DARK, margin: "0 0 12px", letterSpacing: "0.01em" }}>Shumul Hub — Community & Media Centre</h3>
              <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.75)", lineHeight: 1.85, margin: "0 0 24px" }}>An integrated community and media centre in Barqayel — 6 floors, studios, and community spaces.</p>
              <span style={{ fontFamily: FONT_B, fontSize: 14, fontWeight: 700, color: "#dd7c99cc" }}>Explore the project →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: OLIVE_D, color: ON_DARK, padding: "56px clamp(20px,4vw,56px) 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div className="sh-2col" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "clamp(32px,4vw,64px)", paddingBottom: 40, borderBottom: `1px solid ${RULE_D}` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <ShumulLogo size={36} variant="white" />
                <span style={{ fontFamily: FONT_H, fontSize: 24, fontWeight: 900, color: ON_DARK, letterSpacing: "0.02em" }}>Shumul</span>
              </div>
              <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.65)", lineHeight: 1.85, maxWidth: 280, margin: "0 0 16px" }}>A social and humanitarian foundation working in Akkar and North Lebanon.</p>
              <p style={{ fontFamily: FONT_B, fontSize: 12, color: "rgba(248,243,232,0.4)", margin: 0 }}>A sister platform of SpotCast</p>
            </div>
            <div>
              <p style={{ fontFamily: FONT_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(248,243,232,0.4)", marginBottom: 16, textTransform: "uppercase" as const }}>Quick links</p>
              {[["#about", "About"], ["#programs", "Programs"], ["#contact", "Contact"], ["/initiatives/shumul/en", "Shumul Initiative"], ["/hub", "Shumul Hub"]].map(([href, label]) => (
                <div key={href} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.65)", textDecoration: "none" }}>{label}</a>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: FONT_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(248,243,232,0.4)", marginBottom: 16, textTransform: "uppercase" as const }}>Contact</p>
              <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.65)", marginBottom: 8 }}>Akkar, North Lebanon</p>
              <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.65)", marginBottom: 8 }}>info@shumul.org</p>
              <p style={{ fontFamily: FONT_B, fontSize: 14, color: "rgba(248,243,232,0.65)" }}>Monday – Friday</p>
            </div>
          </div>
          <div style={{ paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <p style={{ fontFamily: FONT_B, fontSize: 13, color: "rgba(248,243,232,0.4)", margin: 0 }}>© 2026 Shumul Foundation. All rights reserved.</p>
            <a href="#" style={{ fontFamily: FONT_B, fontSize: 13, color: "rgba(248,243,232,0.4)", textDecoration: "none" }}>↑ Back to top</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
