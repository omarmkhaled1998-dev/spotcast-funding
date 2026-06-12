"use client";

import Link from "next/link";
import { SpotCastLogo } from "@/components/hub/SpotCastLogo";

const ROSE = "#C4607A";
const NAVY = "#0e2334";
const GRAY = "#839ba3";
const LIGHT = "#f5f3f0";

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: `${ROSE}30` }} />
      {label && (
        <span className="text-xs tracking-widest uppercase" style={{ color: ROSE }}>
          {label}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: `${ROSE}30` }} />
    </div>
  );
}

const PILLARS = [
  {
    n: "01",
    title: "Financial Systems & Sustainability",
    items: [
      "Accounting & financial management systems",
      "Financial planning & sustainability models",
      "Digital payment guidance",
      "Inventory & pricing policies",
    ],
  },
  {
    n: "02",
    title: "Legal Compliance & Proposals",
    items: [
      "Legal registration & tender files",
      "Tax compliance guide",
      "Proposal writing & grant applications",
      "Bid files & donor submissions",
    ],
  },
  {
    n: "03",
    title: "Digital Presence & Communications",
    items: [
      "Digital audit & social media setup",
      "Website building",
      "Monthly content plan",
      "Team digital tools training",
    ],
  },
];

const STEPS = [
  {
    n: "1",
    title: "Institution Applies",
    desc: "The emerging organization registers through a simple form describing its work and needs.",
  },
  {
    n: "2",
    title: "Student Team Diagnoses",
    desc: "A university student team visits the organization and conducts a thorough field analysis to identify priorities.",
  },
  {
    n: "3",
    title: "6-Month Action Plan Executed",
    desc: "The team builds a comprehensive action plan with the organization and follows through on implementation over six months.",
  },
];

const BENEFICIARIES = [
  "Youth associations & community initiatives",
  "Micro and small enterprises",
  "Local cooperatives",
  "Municipal initiatives",
];

export default function ShumulInitiativeEnglish() {
  return (
    <div className="min-h-screen" style={{ background: "#fff", color: NAVY }}>

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.96)", borderBottom: `1px solid ${ROSE}22` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={36} variant="color" />
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: NAVY }}>Shumul Initiative</p>
              <p className="text-xs leading-tight" style={{ color: GRAY }}>Institutional Development · Akkar & North Lebanon</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/initiatives/shumul"
              className="text-xs transition-colors hover:text-rose-500"
              style={{ color: GRAY, border: `1px solid ${GRAY}44`, borderRadius: 20, padding: "4px 14px" }}
            >
              العربية
            </Link>
            <a href="#register" className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: ROSE }}>
              Register Now
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: NAVY, minHeight: "68vh" }} className="flex items-center px-6 py-20">
        <div className="mx-auto w-full max-w-4xl text-center text-white">
          <p className="mb-4 text-xs tracking-widest uppercase" style={{ color: ROSE }}>
            SpotCast · Grant-Funded · No Fees
          </p>
          <h1 className="font-extrabold leading-tight mb-4" style={{ fontSize: "clamp(28px, 5vw, 52px)", fontFamily: "Georgia, serif" }}>
            Shumul Institutional<br />Development Initiative
          </h1>
          <p className="font-semibold mb-4" style={{ fontSize: "clamp(16px, 2.5vw, 22px)", color: ROSE }}>
            Organizations Grow · Youth Learns · Economy Moves
          </p>
          <p className="mb-10 max-w-2xl mx-auto leading-relaxed text-base" style={{ color: GRAY }}>
            Free institutional development services for emerging organizations in Akkar and North Lebanon —
            delivered by specialized student teams under professional supervision, fully funded by donors.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#register" className="rounded-full px-8 py-3 text-sm font-bold text-white" style={{ background: ROSE }}>
              Register Your Institution →
            </a>
            <a href="#students" className="rounded-full px-8 py-3 text-sm font-semibold"
              style={{ border: `1px solid ${GRAY}`, color: GRAY }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = ROSE; e.currentTarget.style.color = ROSE; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY; }}
            >
              Join as a Student
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-xs mx-auto">
            {[["3", "Pillars"], ["6", "Months"], ["$0", "Fees"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-3xl font-extrabold" style={{ color: ROSE, fontFamily: "Georgia, serif" }}>{n}</p>
                <p className="text-xs tracking-wider" style={{ color: GRAY }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Three Pillars" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>What We Offer</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              Three integrated pillars covering everything an emerging organization needs to launch with confidence.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ n, title, items }) => (
              <div key={n} className="rounded-2xl bg-white p-7" style={{ border: `1px solid ${ROSE}22`, boxShadow: `0 2px 20px ${NAVY}08` }}>
                <span className="text-3xl font-black block mb-3" style={{ color: ROSE }}>{n}</span>
                <h3 className="text-base font-bold mb-4" style={{ color: NAVY }}>{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm" style={{ color: GRAY }}>
                      <span style={{ color: ROSE, flexShrink: 0 }}>●</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Divider label="How It Works" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              Simple. Structured. Impactful.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative rounded-2xl p-7 text-center" style={{ background: LIGHT, border: `1px solid ${ROSE}22` }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-extrabold text-white mb-4" style={{ background: ROSE }}>
                  {n}
                </span>
                <h3 className="text-base font-bold mb-2" style={{ color: NAVY }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Students ── */}
      <section id="students" className="py-20 px-6" style={{ background: NAVY }}>
        <div className="mx-auto max-w-5xl">
          <Divider label="For Students" />
          <div className="my-10 grid items-center gap-12 md:grid-cols-2">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-6 md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
                Join as a Student —<br />
                <span style={{ color: ROSE }}>Learn from the Field.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: GRAY }}>
                This isn&apos;t ordinary volunteering. It&apos;s real professional experience on the ground —
                you diagnose an emerging organization, build its action plan, and follow through on implementation.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "6-month commitment with certified participation",
                  "Genuine professional training in a field environment",
                  "Transport support for students outside the region",
                  "Direct supervision by the SpotCast team",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm" style={{ color: GRAY }}>
                    <span style={{ color: ROSE }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="rounded-xl p-5" style={{ background: "#122033", border: `1px solid ${ROSE}22` }}>
                <p className="text-xs mb-1" style={{ color: ROSE }}>Recruitment Partner</p>
                <p className="text-sm font-bold text-white">INJAZ Lebanon</p>
                <p className="text-xs mt-1" style={{ color: GRAY }}>
                  Handles recruitment and transport support coordination for students from all universities
                </p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl p-7" style={{ background: "#122033", border: `1px solid ${ROSE}22` }}>
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: ROSE }}>Target Universities</p>
                {[
                  "Lebanese International University — LIU",
                  "American University of Technology — AUT",
                  "University of Balamand",
                  "Akkar students at other universities",
                ].map((u) => (
                  <div key={u} className="flex gap-2 items-center py-3" style={{ borderBottom: `1px solid ${ROSE}15` }}>
                    <span style={{ color: ROSE }}>◆</span>
                    <span className="text-sm text-white">{u}</span>
                  </div>
                ))}
                <a
                  href="mailto:Omar.khaled@spotcast.press?subject=Student Application - Shumul Initiative"
                  className="mt-5 block text-center rounded-full py-3 text-sm font-bold text-white"
                  style={{ background: ROSE }}
                >
                  Join as a Student →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Beneficiaries ── */}
      <section className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-5xl">
          <Divider label="Who Can Benefit" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              Who Is This For?
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              Phase 1 is open to emerging organizations in Akkar and North Lebanon only.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {BENEFICIARIES.map((b) => (
              <div key={b} className="flex items-center gap-4 rounded-2xl bg-white px-6 py-5"
                style={{ border: `1px solid ${ROSE}22`, boxShadow: `0 2px 12px ${NAVY}06` }}>
                <span style={{ color: ROSE, fontSize: 18, flexShrink: 0 }}>◆</span>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs" style={{ color: GRAY }}>
            Phase 1: Akkar & North Lebanon only · Expansion planned for later phases
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" className="py-24 px-6" style={{ background: ROSE }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs tracking-widest uppercase text-white/80">Get Involved</p>
          <h2 className="text-4xl font-bold text-white mb-6 md:text-5xl" style={{ fontFamily: "Georgia, serif" }}>
            Your Organization<br />Deserves to Grow.
          </h2>
          <p className="text-base mb-10 max-w-xl mx-auto text-white/80 leading-relaxed">
            No fees, no complex requirements. Just a real commitment to development and an eager student team working alongside you.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="mailto:Omar.khaled@spotcast.press?subject=Institution Registration - Shumul Initiative"
              className="flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-white"
              style={{ background: NAVY }}
            >
              <span>✉</span><span>Register Your Institution</span>
            </a>
            <a
              href="mailto:Omar.khaled@spotcast.press?subject=Student Application - Shumul Initiative"
              className="flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-white"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              <span>🎓</span><span>Join as a Student</span>
            </a>
          </div>
          <p className="mt-5 text-xs text-white/60">
            Omar.khaled@spotcast.press · Initiative Lead: Bashir AlRifaii
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ background: NAVY, borderTop: `1px solid ${ROSE}22` }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={30} variant="white" />
            <div>
              <p className="text-xs font-semibold text-white">Shumul Institutional Development Initiative</p>
              <p className="text-xs" style={{ color: GRAY }}>A SpotCast Initiative · Akkar & North Lebanon</p>
            </div>
          </div>
          <a href="/" className="text-xs transition-colors hover:text-rose-400" style={{ color: GRAY }}>
            ← Back to Shumul Hub
          </a>
          <a href="mailto:Omar.khaled@spotcast.press" className="text-xs transition-colors hover:text-rose-400" style={{ color: GRAY }}>
            Omar.khaled@spotcast.press
          </a>
        </div>
      </footer>
    </div>
  );
}
