"use client";
import { useState } from "react";
import Link from "next/link";
import { ShumulLogo } from "@/components/hub/ShumulLogo";
import { InjazLogo } from "@/components/hub/InjazLogo";
import { SpotCastLogo } from "@/components/hub/SpotCastLogo";

/* ─── Design tokens ─────────────────────────────────────────── */
const BG        = "#F8F3E8";
const BG_ALT    = "#F1E9DA";
const SURFACE   = "#FBF7EE";
const INK       = "#1F1A14";
const INK_700   = "#3D362F";
const INK_500   = "#6B6258";
const OLIVE     = "#4A5C39";
const OLIVE_D   = "#3A4A2C";
const TERRA     = "#C76B4A";
const TERRA_D   = "#B05839";
const RULE      = "rgba(31,26,20,0.12)";
const RULE_SOFT = "rgba(31,26,20,0.06)";
const ON_DARK   = "#FBF7EE";

/* ─── Typography ─────────────────────────────────────────────── */
const FONT_HEAD = "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif";
const FONT_BODY = "var(--font-barlow), 'Barlow', sans-serif";

/* ─── Content ───────────────────────────────────────────────── */
const WINS = [
  { glyph: "◈", title: "Students", desc: "Real field training, recognized certificate & job-ready skills over 6 months" },
  { glyph: "◫", title: "Institutions", desc: "Finance, legal & digital services — 100% free to beneficiaries" },
  { glyph: "◉", title: "SpotCast", desc: "Community impact, documented outcomes & a real institutional track record" },
  { glyph: "◎", title: "INJAZ Lebanon", desc: "Expanded reach in Akkar, meaningful student placements, co-authored impact" },
];

const PILLARS = [
  {
    n: "01", tag: "Finance · Business",
    title: "Financial Systems & Sustainability",
    items: ["Accounting system setup & financial planning frameworks", "Revenue diversification & sustainability models", "Digital payment adoption guidance", "Inventory policy design & pricing strategy"],
  },
  {
    n: "02", tag: "Law · Administration",
    title: "Legal Compliance & Proposal Writing",
    items: ["Legal registration support & RFP/tender file preparation", "Tax compliance guidance & documentation", "Grant proposal writing for beneficiary institutions", "Contract templates & compliance framework"],
  },
  {
    n: "03", tag: "Media · Technology",
    title: "Digital Presence & Independence",
    items: ["Social media setup, management & content strategy", "Website development & SEO basics", "Monthly content planning & scheduling", "Internal digital capacity training — self-sufficiency goal"],
  },
];

const PHASES = [
  {
    tag: "Phase 0", name: "Foundation", period: "Aug – Sep 2026",
    items: ["Sign formal partnership agreement with INJAZ Lebanon", "Identify & vet 3–5 pilot institutions in Akkar", "Build student selection criteria & pre-deployment training kit", "Design the institutional diagnostic assessment tool (15–20 questions)"],
  },
  {
    tag: "Phase 1", name: "Pilot", period: "Oct – Dec 2026",
    items: ["Recruit 6–9 student interns from North Lebanon universities", "Deploy 2–3 interns per institution for 2 months", "Execute tailored development action plans per institution", "Rigorous documentation of all outputs & impact metrics"],
  },
  {
    tag: "Phase 2", name: "Scale", period: "Jan – Mar 2027",
    items: ["Compile impact report & documented success stories", "Expand to 10+ institutions across North Lebanon"],
  },
];

const SECTORS = ["Agriculture & Agri-food", "Traditional Crafts & Trades", "Local Retail & Commerce", "Digital & Tech Services", "Agricultural Cooperatives", "Women-led Cooperatives", "Youth Associations", "Municipal Initiatives"];

/* ─── SectionEyebrow ─────────────────────────────────────────── */
function SectionEyebrow({ label, light }: { label: string; light?: boolean }) {
  const color = light ? "rgba(251,247,238,0.65)" : OLIVE;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase" as const, color }}>
      <span style={{ width: 28, height: 1, background: "currentColor", display: "inline-block", flexShrink: 0 }} />
      {label}
    </div>
  );
}

/* ─── Mini UI primitives ─────────────────────────────────────── */
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</label>
      <input
        {...props}
        style={{ width: "100%", borderRadius: 3, padding: "9px 12px", fontSize: 14, outline: "none", border: `1px solid ${RULE}`, background: SURFACE, color: INK, fontFamily: FONT_BODY, boxSizing: "border-box" as const }}
      />
    </div>
  );
}

function Select({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</label>
      <select
        {...props}
        style={{ width: "100%", borderRadius: 3, padding: "9px 12px", fontSize: 14, outline: "none", border: `1px solid ${RULE}`, background: SURFACE, color: props.value ? INK : INK_500, fontFamily: FONT_BODY, boxSizing: "border-box" as const }}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, marginBottom: 5, color: INK, fontFamily: FONT_BODY, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</label>
      <textarea
        {...props}
        style={{ width: "100%", borderRadius: 3, padding: "9px 12px", fontSize: 14, outline: "none", border: `1px solid ${RULE}`, background: SURFACE, color: INK, fontFamily: FONT_BODY, resize: "none" as const, boxSizing: "border-box" as const }}
      />
    </div>
  );
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, borderRadius: 2, fontSize: 11, fontWeight: 700, flexShrink: 0,
              background: i <= current ? OLIVE : RULE,
              color: i <= current ? ON_DARK : INK_500,
              fontFamily: FONT_BODY,
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 11, display: "none", fontFamily: FONT_BODY, color: i === current ? OLIVE : INK_500, fontWeight: i === current ? 600 : 400 }}
              className="sm-show">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ height: 1, flex: 1, margin: "0 4px", background: i < current ? OLIVE : RULE }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── InstitutionForm ─────────────────────────────────────────── */
function InstitutionForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ orgName: "", orgType: "", location: "", teamSize: "", challenges: "", description: "", contactName: "", email: "", phone: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setData(d => ({ ...d, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/initiatives/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "institution", ...data }) });
    setLoading(false);
    onDone();
  }

  const s0 = (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <Input label="Organization Name *" value={data.orgName} onChange={set("orgName")} required />
      <Select label="Organization Type *" value={data.orgType} onChange={set("orgType")} required
        options={["Youth Association", "Micro / Small Enterprise", "Cooperative", "Municipal Initiative", "NGO / CSO", "Other"]} />
      <Select label="Location *" value={data.location} onChange={set("location")} required
        options={["Akkar", "North Lebanon (other)", "Both"]} />
      <Select label="Team Size" value={data.teamSize} onChange={set("teamSize")}
        options={["1–5 people", "6–15 people", "16–50 people", "50+ people"]} />
    </div>
  );
  const s1 = (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <Select label="Primary Challenge *" value={data.challenges} onChange={set("challenges")} required
        options={["Financial Systems & Sustainability", "Legal Compliance & Proposals", "Digital Presence & Communications", "All three"]} />
      <Textarea label="Brief Description of Your Organization *" value={data.description} onChange={set("description")} rows={3} required placeholder="What does your organization do? What do you hope to achieve with Shumul's support?" />
    </div>
  );
  const s2 = (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <Input label="Contact Person Name *" value={data.contactName} onChange={set("contactName")} required />
      <Input label="Email Address *" type="email" value={data.email} onChange={set("email")} required />
      <Input label="Phone Number" type="tel" value={data.phone} onChange={set("phone")} placeholder="+961 xx xxx xxx" />
    </div>
  );
  const steps = [s0, s1, s2];
  const labels = ["Organization Details", "Needs Assessment", "Contact Info"];

  return (
    <form onSubmit={submit}>
      <StepIndicator steps={labels} current={step} />
      <div style={{ marginTop: 20 }}>{steps[step]}</div>
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {step > 0 && (
          <button type="button" onClick={() => setStep(s => s - 1)}
            style={{ flex: 1, borderRadius: 2, padding: "11px 0", fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${RULE}`, background: "transparent", color: INK_500, fontFamily: FONT_BODY }}>
            Back
          </button>
        )}
        {step < steps.length - 1
          ? (
            <button type="button" onClick={() => setStep(s => s + 1)}
              style={{ flex: 1, borderRadius: 2, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: OLIVE, color: ON_DARK, fontFamily: FONT_BODY }}>
              Next
            </button>
          )
          : (
            <button type="submit" disabled={loading}
              style={{ flex: 1, borderRadius: 2, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", border: "none", background: loading ? INK_500 : OLIVE, color: ON_DARK, fontFamily: FONT_BODY }}>
              {loading ? "Sending…" : "Submit Registration"}
            </button>
          )}
      </div>
    </form>
  );
}

/* ─── StudentForm ─────────────────────────────────────────────── */
function StudentForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ fullName: "", university: "", faculty: "", year: "", email: "", phone: "", motivation: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setData(d => ({ ...d, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/initiatives/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "student", ...data }) });
    setLoading(false);
    onDone();
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <Input label="Full Name *" value={data.fullName} onChange={set("fullName")} required />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="University *" value={data.university} onChange={set("university")} required
          options={["Lebanese International University (LIU)", "American University of Technology (AUT)", "University of Balamand", "Lebanese University", "Other"]} />
        <Select label="Faculty / Major *" value={data.faculty} onChange={set("faculty")} required
          options={["Business Administration", "Law", "Media & Communications", "Information Technology", "Engineering", "Other"]} />
      </div>
      <Select label="Academic Year *" value={data.year} onChange={set("year")} required
        options={["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate Student", "Recent Graduate"]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Email *" type="email" value={data.email} onChange={set("email")} required />
        <Input label="Phone" type="tel" value={data.phone} onChange={set("phone")} placeholder="+961" />
      </div>
      <Textarea label="Why do you want to join? *" value={data.motivation} onChange={set("motivation")} rows={3} required placeholder="Tell us about your interest and what you hope to contribute…" />
      <button type="submit" disabled={loading}
        style={{ width: "100%", borderRadius: 2, padding: "11px 0", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", border: "none", background: loading ? INK_500 : OLIVE, color: ON_DARK, fontFamily: FONT_BODY, marginTop: 4 }}>
        {loading ? "Sending…" : "Submit Application"}
      </button>
    </form>
  );
}

/* ─── Modal ──────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(31,26,20,0.6)" }}>
      <div style={{ width: "100%", maxWidth: 520, borderRadius: 6, overflow: "hidden", boxShadow: "0 20px 60px rgba(31,26,20,0.28)", background: BG, maxHeight: "92vh", overflowY: "auto" as const }}>
        <div style={{ padding: "22px 24px 18px", background: OLIVE_D }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 20, color: ON_DARK, margin: 0, letterSpacing: "-0.01em" }}>{title}</h3>
              {subtitle && <p style={{ fontSize: 13, marginTop: 4, color: "rgba(251,247,238,0.65)", fontFamily: FONT_BODY }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} style={{ color: "rgba(251,247,238,0.55)", background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1, marginLeft: 16, padding: 0 }}>&#x2715;</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}

function SuccessView({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{ width: 48, height: 48, borderRadius: 2, background: OLIVE, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: ON_DARK, fontSize: 22, fontWeight: 700 }}>✓</span>
      </div>
      <h3 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: INK, marginBottom: 10, letterSpacing: "-0.01em" }}>Submitted Successfully</h3>
      <p style={{ fontSize: 14, marginBottom: 24, color: INK_700, fontFamily: FONT_BODY, lineHeight: 1.6 }}>{message}</p>
      <button onClick={onClose} style={{ borderRadius: 2, padding: "11px 36px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: OLIVE, color: ON_DARK, fontFamily: FONT_BODY }}>
        Close
      </button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ShumulInitiativeEN() {
  const [modal, setModal] = useState<"institution" | "student" | null>(null);
  const [done, setDone] = useState<"institution" | "student" | null>(null);

  const heroBackground = `radial-gradient(ellipse at 30% 20%, rgba(122,143,94,0.45), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(58,74,44,0.55), transparent 60%), linear-gradient(135deg, #5E7349 0%, #3A4A2C 100%)`;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: FONT_BODY }}>

      {/* ── Nav ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(8px)", background: "rgba(248,243,232,0.96)", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ margin: "0 auto", maxWidth: 1152, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShumulLogo size={34} variant="light" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: INK, fontFamily: FONT_HEAD, letterSpacing: "-0.01em", margin: 0 }}>Shumul Initiative</p>
              <p style={{ fontSize: 11, color: INK_500, fontFamily: FONT_BODY, margin: 0 }}>Institutional Development · Akkar & North Lebanon</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/initiatives/shumul"
              style={{ fontSize: 12, padding: "6px 14px", borderRadius: 2, color: INK_500, border: `1px solid ${RULE}`, textDecoration: "none", fontFamily: FONT_BODY, fontWeight: 500 }}>
              العربية
            </Link>
            <button onClick={() => setModal("institution")}
              style={{ borderRadius: 2, padding: "8px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: OLIVE, color: ON_DARK, fontFamily: FONT_BODY }}>
              Register Now
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: heroBackground, minHeight: "72vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", padding: "80px 24px" }}>
        {/* Grain overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          opacity: 0.5, mixBlendMode: "overlay" as const, pointerEvents: "none" as const,
        }} />
        <div style={{ margin: "0 auto", width: "100%", maxWidth: 960, position: "relative", zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{ marginBottom: 24 }}>
            <SectionEyebrow label="Program Brief · INJAZ Lebanon Partnership" light />
          </div>
          <h1 style={{ fontFamily: FONT_HEAD, fontWeight: 800, lineHeight: 1.0, color: ON_DARK, marginBottom: 12, letterSpacing: "-0.01em", fontSize: "clamp(36px, 6.5vw, 64px)" }}>
            Shumul Initiative
          </h1>
          <p style={{ fontWeight: 400, color: "rgba(251,247,238,0.6)", marginBottom: 16, fontSize: "clamp(15px, 2.5vw, 20px)", fontFamily: "var(--font-noto-kufi), 'Noto Kufi Arabic', sans-serif" }}>
            مبادرة شمول للتطوير المؤسسي
          </p>
          <p style={{ maxWidth: 560, lineHeight: 1.65, marginBottom: 32, color: "rgba(251,247,238,0.82)", fontSize: 15, fontFamily: FONT_BODY }}>
            A free institutional development program pairing university students with small and emerging
            organizations in Akkar &amp; North Lebanon — zero cost to beneficiaries.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
            <button onClick={() => setModal("institution")}
              style={{ borderRadius: 2, padding: "13px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none", background: SURFACE, color: OLIVE_D, fontFamily: FONT_BODY }}>
              Register Your Institution
            </button>
            <button onClick={() => setModal("student")}
              style={{ borderRadius: 2, padding: "13px 28px", fontWeight: 600, fontSize: 14, cursor: "pointer", border: `1px solid rgba(251,247,238,0.35)`, background: "transparent", color: ON_DARK, fontFamily: FONT_BODY }}>
              Join as a Student
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, paddingTop: 20, borderTop: "1px solid rgba(251,247,238,0.15)" }}>
            {[["June 2026", "Launch Date"], ["Akkar & North Lebanon", "Coverage"], ["Oct–Dec 2026", "Pilot Phase"], ["Free", "Zero Cost to Beneficiaries"]].map(([v, l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(251,247,238,0.4)", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(251,247,238,0.82)", fontFamily: FONT_BODY }}>{v}</span>
                <span style={{ fontSize: 12, color: "rgba(251,247,238,0.3)", fontFamily: FONT_BODY }}>·</span>
                <span style={{ fontSize: 12, color: "rgba(251,247,238,0.45)", fontFamily: FONT_BODY }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Triple-win ── */}
      <section style={{ padding: "72px 24px", background: BG_ALT }}>
        <div style={{ margin: "0 auto", maxWidth: 1152 }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionEyebrow label="The Model" />
            <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: "clamp(26px, 4vw, 36px)", color: INK, marginTop: 14, marginBottom: 8, letterSpacing: "-0.01em" }}>
              A Triple-Win Model
            </h2>
            <p style={{ fontSize: 14, color: INK_500, maxWidth: 440, margin: "0 auto", fontFamily: FONT_BODY, lineHeight: 1.6 }}>
              Every stakeholder wins — that&apos;s what makes Shumul sustainable.
            </p>
          </div>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {WINS.map(({ glyph, title, desc }) => (
              <div key={title} style={{ borderRadius: 6, background: SURFACE, padding: "28px 24px", textAlign: "center", border: `1px solid ${RULE_SOFT}`, boxShadow: "0 6px 18px rgba(31,26,20,0.10)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 4, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: BG_ALT, border: `1px solid ${RULE}` }}>
                  <span style={{ fontSize: 18, color: OLIVE, fontFamily: "monospace" }}>{glyph}</span>
                </div>
                <p style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: OLIVE, marginBottom: 8, letterSpacing: "-0.01em" }}>{title}</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: INK_700, fontFamily: FONT_BODY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead quote ── */}
      <section style={{ padding: "56px 24px", background: BG }}>
        <div style={{ margin: "0 auto", maxWidth: 800 }}>
          <div style={{ borderRadius: 4, padding: "28px 32px", background: SURFACE, borderLeft: `3px solid ${OLIVE}`, boxShadow: "0 1px 2px rgba(31,26,20,0.06)" }}>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: INK_700, fontFamily: FONT_BODY, margin: 0 }}>
              <strong style={{ color: OLIVE }}>Shumul</strong> is SpotCast&apos;s free institutional development arm built on a triple-win model —
              students gain real professional training and a recognized certificate, institutions receive specialized advisory services
              at <strong style={{ color: OLIVE }}>zero cost</strong>, and SpotCast builds a measurable community impact record.
              <strong style={{ color: OLIVE }}> Every stakeholder wins.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section style={{ padding: "72px 24px", background: BG_ALT }}>
        <div style={{ margin: "0 auto", maxWidth: 1152 }}>
          <SectionEyebrow label="Service Pillars" />
          <div style={{ marginTop: 20, marginBottom: 40 }}>
            <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: "clamp(26px, 4vw, 36px)", color: INK, marginBottom: 8, letterSpacing: "-0.01em" }}>
              Three Service Pillars
            </h2>
            <p style={{ fontSize: 14, color: INK_500, maxWidth: 480, fontFamily: FONT_BODY, lineHeight: 1.6 }}>
              Integrated expertise covering everything an emerging organization needs.
            </p>
          </div>
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {PILLARS.map(({ n, tag, title, items }) => (
              <div key={n} style={{ borderRadius: 6, overflow: "hidden", border: `1px solid ${RULE}`, boxShadow: "0 1px 2px rgba(31,26,20,0.06)" }}>
                <div style={{ padding: "16px 20px", background: OLIVE_D, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: "rgba(251,247,238,0.15)", color: ON_DARK, fontFamily: FONT_BODY }}>
                    {n}
                  </span>
                  <p style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: ON_DARK, margin: 0, letterSpacing: "-0.01em" }}>{title}</p>
                </div>
                <div style={{ padding: "18px 20px", background: SURFACE }}>
                  <span style={{ display: "inline-block", borderRadius: 2, padding: "3px 8px", fontSize: 11, fontWeight: 600, marginBottom: 14, background: BG_ALT, color: OLIVE, border: `1px solid ${RULE}`, fontFamily: FONT_BODY, letterSpacing: "0.04em" }}>{tag}</span>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {items.map(item => (
                      <li key={item} style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.55, color: INK_700, fontFamily: FONT_BODY }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: TERRA, flexShrink: 0, marginTop: 6, display: "inline-block" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section style={{ padding: "72px 24px", background: BG }}>
        <div style={{ margin: "0 auto", maxWidth: 900 }}>
          <SectionEyebrow label="Expansion Plan" />
          <div style={{ marginTop: 20, marginBottom: 40 }}>
            <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: "clamp(26px, 4vw, 36px)", color: INK, letterSpacing: "-0.01em" }}>
              Phased Expansion Plan
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
            {PHASES.map(({ tag, name, period, items }, idx) => {
              const phaseColors = [
                { bar: OLIVE, badge: BG_ALT },
                { bar: "#5E7349", badge: BG_ALT },
                { bar: OLIVE_D, badge: BG_ALT },
              ];
              const pc = phaseColors[idx] ?? phaseColors[0];
              return (
                <div key={tag} style={{ borderRadius: 4, overflow: "hidden", border: `1px solid ${RULE}`, boxShadow: "0 1px 2px rgba(31,26,20,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", textAlign: "center", padding: "14px 20px", minWidth: 100, background: pc.bar }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(251,247,238,0.7)", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: 0, fontFamily: FONT_BODY }}>{tag}</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: ON_DARK, marginTop: 3, margin: 0, fontFamily: FONT_HEAD, letterSpacing: "-0.01em" }}>{name}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", background: pc.badge, color: OLIVE_D, fontFamily: FONT_BODY, borderLeft: `1px solid ${RULE}` }}>
                      {period}
                    </div>
                  </div>
                  <div style={{ padding: "16px 20px", background: SURFACE, borderTop: `1px solid ${RULE_SOFT}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
                      {items.map(item => (
                        <p key={item} style={{ display: "flex", gap: 8, fontSize: 13, color: INK_700, margin: 0, fontFamily: FONT_BODY, lineHeight: 1.55 }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: TERRA, flexShrink: 0, marginTop: 6, display: "inline-block" }} />{item}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section style={{ padding: "64px 24px", background: BG_ALT }}>
        <div style={{ margin: "0 auto", maxWidth: 900, textAlign: "center" }}>
          <SectionEyebrow label="Target Sectors" />
          <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: "clamp(24px, 3.5vw, 32px)", color: INK, margin: "18px 0 28px", letterSpacing: "-0.01em" }}>
            Who Can Benefit
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            {SECTORS.map(s => (
              <span key={s} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: 2, padding: "8px 16px", fontSize: 13, fontWeight: 500, background: SURFACE, border: `1px solid ${RULE}`, color: INK_700, fontFamily: FONT_BODY }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: OLIVE, flexShrink: 0, display: "inline-block" }} />
                {s}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 12, fontStyle: "italic", color: INK_500, fontFamily: FONT_BODY, marginTop: 16 }}>Phase 1 scope: Akkar &amp; North Lebanon only</p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" style={{ padding: "88px 24px", background: heroBackground, position: "relative", overflow: "hidden" }}>
        {/* Grain overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          opacity: 0.5, mixBlendMode: "overlay" as const, pointerEvents: "none" as const,
        }} />
        <div style={{ margin: "0 auto", maxWidth: 800, textAlign: "center", position: "relative", zIndex: 1 }}>
          <SectionEyebrow label="Get Involved" light />
          <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: "clamp(30px, 5vw, 52px)", color: ON_DARK, margin: "18px 0 16px", letterSpacing: "-0.01em" }}>
            Your Organization<br />Deserves to Grow.
          </h2>
          <p style={{ fontSize: 15, marginBottom: 36, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.65, color: "rgba(251,247,238,0.78)", fontFamily: FONT_BODY }}>
            No fees. No complex requirements. Just a real commitment to development and an eager student team working alongside you.
          </p>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
              <button onClick={() => setModal("institution")}
                style={{ borderRadius: 2, padding: "14px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", background: SURFACE, color: OLIVE_D, fontFamily: FONT_BODY }}>
                Register Your Institution
              </button>
              <button onClick={() => setModal("student")}
                style={{ borderRadius: 2, padding: "14px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", border: `1.5px solid rgba(251,247,238,0.4)`, background: "transparent", color: ON_DARK, fontFamily: FONT_BODY }}>
                Join as a Student
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section style={{ padding: "56px 24px", background: SURFACE }}>
        <div style={{ margin: "0 auto", maxWidth: 900, textAlign: "center" }}>
          <SectionEyebrow label="Partners & Network" />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 40, marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 28px", borderRadius: 4, background: BG, border: `1px solid ${RULE}`, boxShadow: "0 1px 2px rgba(31,26,20,0.06)" }}>
              <ShumulLogo size={36} variant="light" />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: INK, margin: 0, letterSpacing: "-0.01em" }}>Shumul</p>
                <p style={{ fontSize: 11, color: INK_500, fontFamily: FONT_BODY, margin: 0 }}>Institutional Development Initiative</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 28px", borderRadius: 4, background: BG, border: `1px solid ${RULE}`, boxShadow: "0 1px 2px rgba(31,26,20,0.06)" }}>
              <InjazLogo size={36} />
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: INK, margin: 0, letterSpacing: "-0.01em" }}>INJAZ Lebanon</p>
                <p style={{ fontSize: 11, color: INK_500, fontFamily: FONT_BODY, margin: 0 }}>Education & Employment Partner</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "44px 24px", background: OLIVE_D }}>
        <div style={{ margin: "0 auto", maxWidth: 1152, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <SpotCastLogo size={26} variant="white" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: ON_DARK, fontFamily: FONT_HEAD, letterSpacing: "-0.01em", margin: 0 }}>Shumul Institutional Development Initiative</p>
              <p style={{ fontSize: 11, color: "rgba(251,247,238,0.45)", fontFamily: FONT_BODY, margin: 0 }}>A SpotCast Initiative · Akkar & North Lebanon · 2026</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(251,247,238,0.45)", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: FONT_BODY, margin: 0 }}>Program Lead</p>
            <p style={{ fontSize: 13, color: ON_DARK, fontFamily: FONT_BODY, margin: 0 }}>Omar Khaled — Executive Director, SpotCast</p>
            <a href="mailto:Omar.khaled@spotcast.press" style={{ fontSize: 12, color: "rgba(251,247,238,0.45)", fontFamily: FONT_BODY, textDecoration: "none" }}>Omar.khaled@spotcast.press</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(251,247,238,0.45)", textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: FONT_BODY, margin: 0 }}>Field Coordinator</p>
            <p style={{ fontSize: 13, color: ON_DARK, fontFamily: FONT_BODY, margin: 0 }}>Bashir AlRifaii — Project Manager</p>
            <a href="mailto:alrifaibashir66@gmail.com" style={{ fontSize: 12, color: "rgba(251,247,238,0.45)", fontFamily: FONT_BODY, textDecoration: "none" }}>alrifaibashir66@gmail.com</a>
          </div>
          <a href="/hub" style={{ fontSize: 12, color: "rgba(251,247,238,0.45)", fontFamily: FONT_BODY, textDecoration: "none" }}>
            Back to Shumul Hub
          </a>
        </div>
      </footer>

      {/* ── Modals ── */}
      {modal === "institution" && !done && (
        <Modal title="Register Your Institution" subtitle="Free institutional development services — Akkar & North Lebanon" onClose={() => setModal(null)}>
          <InstitutionForm onDone={() => { setModal(null); setDone("institution"); }} />
        </Modal>
      )}
      {modal === "student" && !done && (
        <Modal title="Join as a Student" subtitle="6-month commitment · Certified participation · Real field training" onClose={() => setModal(null)}>
          <StudentForm onDone={() => { setModal(null); setDone("student"); }} />
        </Modal>
      )}
      {done === "institution" && (
        <Modal title="Thank You" subtitle="" onClose={() => setDone(null)}>
          <SuccessView message="Your registration has been received. Omar Khaled and Bashir AlRifaii will be in touch within 48 hours." onClose={() => setDone(null)} />
        </Modal>
      )}
      {done === "student" && (
        <Modal title="Application Received" subtitle="" onClose={() => setDone(null)}>
          <SuccessView message="Your student application has been submitted. We'll review it and reach out shortly." onClose={() => setDone(null)} />
        </Modal>
      )}
    </div>
  );
}
