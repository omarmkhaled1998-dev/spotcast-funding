"use client";

import { useState } from "react";
import Link from "next/link";
import { SpotCastLogo } from "@/components/hub/SpotCastLogo";

/* ─── Design tokens ─────────────────────────────────────────── */
const R = "#C4607A";       // rose
const RD = "#9e3d55";      // rose dark
const RL = "#fdf0f4";      // rose light
const NAVY = "#1a1a2e";
const GRAY = "#6b7280";
const BORDER = "#e5e7eb";

/* ─── Content ───────────────────────────────────────────────── */
const WINS = [
  { icon: "🎓", title: "Students", desc: "Real field training, recognized certificate & job-ready skills over 6 months" },
  { icon: "🏢", title: "Institutions", desc: "Finance, legal & digital services — 100% free, grant-funded" },
  { icon: "🌱", title: "SpotCast", desc: "Community impact, documented outcomes & international grant eligibility" },
  { icon: "🤝", title: "INJAZ Lebanon", desc: "Expanded reach in Akkar, meaningful student placements, co-authored impact" },
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
    bg: "#a84060", periodBg: "#f5d5de", periodColor: "#7a1f35",
    items: ["Sign formal partnership agreement with INJAZ Lebanon", "Identify & vet 3–5 pilot institutions in Akkar", "Build student selection criteria & pre-deployment training kit", "Design the institutional diagnostic assessment tool (15–20 questions)"],
  },
  {
    tag: "Phase 1", name: "Pilot", period: "Oct – Dec 2026",
    bg: R, periodBg: "#f0c8d4", periodColor: "#6a1f35",
    items: ["Recruit 6–9 student interns from North Lebanon universities", "Deploy 2–3 interns per institution for 2 months", "Execute tailored development action plans per institution", "Rigorous documentation of all outputs & impact metrics"],
  },
  {
    tag: "Phase 2", name: "Scale & Fund", period: "Jan – Mar 2027",
    bg: "#7a2535", periodBg: "#e0a8b8", periodColor: "#50091a",
    items: ["Compile impact report & documented success stories", "Build full international funding proposal", "Submit to EU Delegation, GIZ, Swisscontact, UNICEF", "Expand to 10+ institutions across North Lebanon"],
  },
];

const SECTORS = ["Agriculture & Agri-food", "Traditional Crafts & Trades", "Local Retail & Commerce", "Digital & Tech Services", "Agricultural Cooperatives", "Women-led Cooperatives", "Youth Associations", "Municipal Initiatives"];

const RESPONSIBILITIES = {
  injaz: ["Recruit university students & recent graduates from North Lebanese universities", "Student disciplines: Business Admin, Law, Media & Communications, Technology", "Cover student transportation allowance for the full 2-month deployment period"],
  shumul: ["Source, assess & onboard beneficiary institutions against defined eligibility criteria", "Develop & administer the institutional diagnostic tool (15–20 question assessment)", "Full field supervision, intern management & logistics coordination", "Documentation, impact reporting & communications / grant applications"],
};

/* ─── RegistrationForm ─────────────────────────────────────── */
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
    <div className="space-y-4">
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
    <div className="space-y-4">
      <Select label="Primary Challenge *" value={data.challenges} onChange={set("challenges")} required
        options={["Financial Systems & Sustainability", "Legal Compliance & Proposals", "Digital Presence & Communications", "All three"]} />
      <Textarea label="Brief Description of Your Organization *" value={data.description} onChange={set("description")} rows={3} required placeholder="What does your organization do? What do you hope to achieve with Shumul's support?" />
    </div>
  );
  const s2 = (
    <div className="space-y-4">
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
      <div className="mt-5">{steps[step]}</div>
      <div className="flex gap-3 mt-6">
        {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ border: `1px solid ${BORDER}`, color: GRAY }}>← Back</button>}
        {step < steps.length - 1
          ? <button type="button" onClick={() => setStep(s => s + 1)} className="flex-1 rounded-xl py-3 text-sm font-bold text-white" style={{ background: R }}>Next →</button>
          : <button type="submit" disabled={loading} className="flex-1 rounded-xl py-3 text-sm font-bold text-white" style={{ background: loading ? "#c49" : R }}>
              {loading ? "Sending…" : "Submit Registration"}
            </button>}
      </div>
    </form>
  );
}

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
    <form onSubmit={submit} className="space-y-4">
      <Input label="Full Name *" value={data.fullName} onChange={set("fullName")} required />
      <div className="grid grid-cols-2 gap-3">
        <Select label="University *" value={data.university} onChange={set("university")} required
          options={["Lebanese International University (LIU)", "American University of Technology (AUT)", "University of Balamand", "Lebanese University", "Other"]} />
        <Select label="Faculty / Major *" value={data.faculty} onChange={set("faculty")} required
          options={["Business Administration", "Law", "Media & Communications", "Information Technology", "Engineering", "Other"]} />
      </div>
      <Select label="Academic Year *" value={data.year} onChange={set("year")} required
        options={["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate Student", "Recent Graduate"]} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Email *" type="email" value={data.email} onChange={set("email")} required />
        <Input label="Phone" type="tel" value={data.phone} onChange={set("phone")} placeholder="+961" />
      </div>
      <Textarea label="Why do you want to join? *" value={data.motivation} onChange={set("motivation")} rows={3} required placeholder="Tell us about your interest and what you hope to contribute…" />
      <button type="submit" disabled={loading} className="w-full rounded-xl py-3 text-sm font-bold text-white mt-2" style={{ background: loading ? "#c49" : R }}>
        {loading ? "Sending…" : "Submit Application"}
      </button>
    </form>
  );
}

/* ─── Mini UI primitives ─────────────────────────────────────── */
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: NAVY }}>{label}</label>
      <input {...props} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2" style={{ border: `1px solid ${BORDER}`, background: "#fafafa", color: NAVY }} />
    </div>
  );
}
function Select({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: NAVY }}>{label}</label>
      <select {...props} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={{ border: `1px solid ${BORDER}`, background: "#fafafa", color: props.value ? NAVY : GRAY }}>
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: NAVY }}>{label}</label>
      <textarea {...props} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none" style={{ border: `1px solid ${BORDER}`, background: "#fafafa", color: NAVY }} />
    </div>
  );
}
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0"
              style={{ background: i <= current ? R : BORDER, color: i <= current ? "#fff" : GRAY }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: i === current ? R : GRAY, fontWeight: i === current ? 600 : 400 }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="h-px flex-1 mx-1" style={{ background: i < current ? R : BORDER }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#fff", maxHeight: "92vh", overflowY: "auto" }}>
        <div className="px-6 pt-6 pb-4" style={{ background: `linear-gradient(135deg, ${RD}, ${R})` }}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.8)" }}>{subtitle}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl leading-none ml-4">✕</button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function SuccessView({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="text-center py-6">
      <div className="text-5xl mb-4">✅</div>
      <h3 className="font-bold text-lg mb-2" style={{ color: NAVY }}>Submitted Successfully!</h3>
      <p className="text-sm mb-6" style={{ color: GRAY }}>{message}</p>
      <button onClick={onClose} className="rounded-full px-8 py-3 text-sm font-bold text-white" style={{ background: R }}>Close</button>
    </div>
  );
}

/* ─── Section divider ─────────────────────────────────────────── */
function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: `${R}30` }} />
      {label && <span className="text-xs tracking-widest uppercase px-2" style={{ color: R }}>{label}</span>}
      <div className="flex-1 h-px" style={{ background: `${R}30` }} />
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ShumulInitiativeEN() {
  const [modal, setModal] = useState<"institution" | "student" | null>(null);
  const [done, setDone] = useState<"institution" | "student" | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#fff", color: NAVY }}>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.96)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={34} variant="color" />
            <div>
              <p className="text-sm font-bold" style={{ color: NAVY }}>Shumul Initiative</p>
              <p className="text-xs" style={{ color: GRAY }}>Institutional Development · Akkar & North Lebanon</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/initiatives/shumul" className="text-xs px-3 py-1.5 rounded-full transition-colors" style={{ color: GRAY, border: `1px solid ${BORDER}` }}>
              العربية
            </Link>
            <button onClick={() => setModal("institution")} className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: R }}>
              Register Now
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: `linear-gradient(135deg, #7a1f35 0%, ${R} 55%, #d97a92 100%)`, minHeight: "72vh", position: "relative", overflow: "hidden" }} className="flex items-center px-6 py-20">
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -80, right: -60, width: 320, height: 320, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -60, left: 60, width: 200, height: 200, background: "rgba(255,255,255,0.04)", borderRadius: "50%" }} />
        <div className="mx-auto w-full max-w-5xl relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.28)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
            <span className="text-white/90 text-xs font-semibold tracking-widest uppercase">Program Brief · INJAZ Lebanon Partnership</span>
          </div>
          <h1 className="font-extrabold leading-tight text-white mb-3" style={{ fontSize: "clamp(32px, 6vw, 58px)", letterSpacing: "-0.5px" }}>
            Shumul Initiative
          </h1>
          <p className="font-light text-white/75 mb-4" style={{ fontSize: "clamp(14px, 2.5vw, 20px)" }}>
            مبادرة شمول للتطوير المؤسسي
          </p>
          <p className="max-w-xl leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.85)", fontSize: 15 }}>
            A free institutional development program pairing university students with small and emerging
            organizations in Akkar & North Lebanon — grant-funded, zero cost to beneficiaries.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => setModal("institution")} className="rounded-full px-7 py-3 font-bold text-sm" style={{ background: "#fff", color: R }}>
              Register Your Institution →
            </button>
            <button onClick={() => setModal("student")} className="rounded-full px-7 py-3 font-semibold text-sm text-white" style={{ border: "1px solid rgba(255,255,255,0.45)" }}>
              Join as a Student
            </button>
          </div>
          <div className="flex flex-wrap gap-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            {[["June 2026", "Launch Date"], ["Akkar & North Lebanon", "Coverage"], ["Oct–Dec 2026", "Pilot Phase"], ["Grant-Funded", "Free to Beneficiaries"]].map(([v, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
                <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{v}</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Triple-win ── */}
      <section className="py-16 px-6" style={{ background: "#fafafa" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: R }}>The Model</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif", color: NAVY }}>A Triple-Win Model</h2>
            <p className="text-sm mt-2 max-w-lg mx-auto" style={{ color: GRAY }}>Every stakeholder wins — that&apos;s what makes Shumul sustainable.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {WINS.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white p-6 text-center" style={{ border: `1.5px solid ${BORDER}`, boxShadow: `0 2px 16px ${NAVY}06` }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: RL }}>{icon}</div>
                <p className="font-bold text-sm mb-2" style={{ color: R }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead quote ── */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl px-8 py-6" style={{ background: RL, borderLeft: `4px solid ${R}` }}>
            <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
              <strong style={{ color: R }}>Shumul</strong> is SpotCast&apos;s free institutional development arm built on a triple-win model —
              students gain real professional training and a recognized certificate, institutions receive specialized advisory services
              at <strong style={{ color: R }}>zero cost</strong>, and SpotCast builds the track record needed for international development grants.
              <strong style={{ color: R }}> Every stakeholder wins.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-20 px-6" style={{ background: "#f9fafb" }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Service Pillars" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Georgia, serif", color: NAVY }}>Three Service Pillars</h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: GRAY }}>Integrated expertise covering everything an emerging organization needs.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ n, tag, title, items }) => (
              <div key={n} className="rounded-2xl overflow-hidden" style={{ border: `1.5px solid ${BORDER}` }}>
                <div className="px-5 py-4 flex items-center gap-3" style={{ background: R }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.22)", color: "#fff" }}>{n}</div>
                  <p className="font-bold text-sm text-white">{title}</p>
                </div>
                <div className="p-5" style={{ background: "#f9fafb" }}>
                  <span className="inline-block rounded px-2 py-1 text-xs font-bold mb-3" style={{ background: RL, color: R, border: `1px solid #f0c8d4` }}>{tag}</span>
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li key={item} className="flex gap-2 text-xs leading-relaxed" style={{ color: "#444" }}>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: R }} />
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
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Divider label="Expansion Plan" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Georgia, serif", color: NAVY }}>Phased Expansion Plan</h2>
          </div>
          <div className="space-y-4">
            {PHASES.map(({ tag, name, period, bg, periodBg, periodColor, items }) => (
              <div key={tag} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-stretch">
                  <div className="flex flex-col items-center justify-center text-center px-5 py-4 min-w-[90px]" style={{ background: bg }}>
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">{tag}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{name}</p>
                  </div>
                  <div className="flex items-center px-4 py-3 text-sm font-semibold whitespace-nowrap" style={{ background: periodBg, color: periodColor }}>{period}</div>
                </div>
                <div className="px-5 py-4" style={{ background: "#f9fafb", borderTop: `1px solid ${BORDER}` }}>
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {items.map(item => (
                      <p key={item} className="text-xs flex gap-2" style={{ color: "#444" }}>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: R }} />{item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sectors ── */}
      <section className="py-16 px-6" style={{ background: "#f9fafb" }}>
        <div className="mx-auto max-w-5xl text-center">
          <Divider label="Target Sectors" />
          <h2 className="text-2xl font-bold my-6" style={{ fontFamily: "Georgia, serif", color: NAVY }}>Who Can Benefit</h2>
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {SECTORS.map(s => (
              <span key={s} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium" style={{ background: RL, border: `1.5px solid #f0c8d4`, color: "#6a1f35" }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: R }} />{s}
              </span>
            ))}
          </div>
          <p className="text-xs italic mt-4" style={{ color: GRAY }}>Phase 1 scope: Akkar & North Lebanon only</p>
        </div>
      </section>

      {/* ── Responsibilities ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Divider label="Partnership" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Georgia, serif", color: NAVY }}>Division of Responsibilities</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid #b0d4e3` }}>
              <div className="px-5 py-4 flex items-center gap-2 font-bold text-sm text-white" style={{ background: "linear-gradient(90deg,#1a6e8a,#2a8aab)" }}>🤝 INJAZ Lebanon</div>
              <div className="px-5 py-4 space-y-3" style={{ background: "#e8f4f9" }}>
                {RESPONSIBILITIES.injaz.map(r => <p key={r} className="flex gap-2 text-sm" style={{ color: "#1a4a5e" }}><span style={{ color: "#1a6e8a", fontWeight: 700 }}>✓</span>{r}</p>)}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid #f0c8d4` }}>
              <div className="px-5 py-4 flex items-center gap-2 font-bold text-sm text-white" style={{ background: `linear-gradient(90deg,${RD},${R})` }}>🌟 Shumul / SpotCast</div>
              <div className="px-5 py-4 space-y-3" style={{ background: RL }}>
                {RESPONSIBILITIES.shumul.map(r => <p key={r} className="flex gap-2 text-sm" style={{ color: RD }}><span style={{ color: R, fontWeight: 700 }}>✓</span>{r}</p>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" className="py-24 px-6" style={{ background: `linear-gradient(135deg, ${RD}, ${R})` }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs tracking-widest uppercase mb-4 text-white/70">Get Involved</p>
          <h2 className="text-4xl font-bold text-white mb-4 md:text-5xl" style={{ fontFamily: "Georgia, serif" }}>
            Your Organization<br />Deserves to Grow.
          </h2>
          <p className="text-base mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
            No fees. No complex requirements. Just a real commitment to development and an eager student team working alongside you.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center mb-10">
            <button onClick={() => setModal("institution")} className="flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold" style={{ background: "#fff", color: R }}>
              🏢 Register Your Institution
            </button>
            <button onClick={() => setModal("student")} className="flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold text-white" style={{ border: "2px solid rgba(255,255,255,0.5)" }}>
              🎓 Join as a Student
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ background: NAVY }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={28} variant="white" />
            <div>
              <p className="text-xs font-bold text-white">Shumul Institutional Development Initiative</p>
              <p className="text-xs" style={{ color: GRAY }}>A SpotCast Initiative · Akkar & North Lebanon · 2026</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold" style={{ color: R }}>Program Lead</p>
            <p className="text-xs text-white">Omar Khaled — Executive Director, SpotCast</p>
            <a href="mailto:Omar.khaled@spotcast.press" className="text-xs" style={{ color: GRAY }}>Omar.khaled@spotcast.press</a>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-semibold" style={{ color: R }}>Field Coordinator</p>
            <p className="text-xs text-white">Bashir AlRifaii — Project Manager</p>
            <a href="mailto:alrifaibashir66@gmail.com" className="text-xs" style={{ color: GRAY }}>alrifaibashir66@gmail.com</a>
          </div>
          <a href="/" className="text-xs hover:text-rose-400 transition-colors" style={{ color: GRAY }}>← Back to Shumul Hub</a>
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
        <Modal title="Thank You!" subtitle="" onClose={() => setDone(null)}>
          <SuccessView message="Your registration has been received. Omar Khaled and Bashir AlRifaii will be in touch within 48 hours." onClose={() => setDone(null)} />
        </Modal>
      )}
      {done === "student" && (
        <Modal title="Application Received!" subtitle="" onClose={() => setDone(null)}>
          <SuccessView message="Your student application has been submitted. We'll review it and reach out shortly." onClose={() => setDone(null)} />
        </Modal>
      )}
    </div>
  );
}
