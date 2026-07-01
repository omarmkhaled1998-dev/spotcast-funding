"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ShumulLogo } from "@/components/hub/ShumulLogo";
import { ShumulTopNav } from "@/components/shumul/ShumulTopNav";

const Building3D = dynamic(() => import("@/components/hub/Building3D"), { ssr: false });

/* ─── Shumul brand tokens ───────────────────────────────────── */
const OLIVE_700 = "#3A4A2C";
const OLIVE_600 = "#4A5C39";
const OLIVE_500 = "#5E7349";
const OLIVE_400 = "#7A8F5E";
const TERRA     = "#C76B4A";
const TERRA_600 = "#B05839";
const TERRA_300 = "#E8B49E";
const BEIGE_500 = "#E9DFCE";
const BEIGE_400 = "#F1E9DA";
const BEIGE_300 = "#F8F3E8";
const BEIGE_200 = "#FBF7EE";
const INK_900   = "#1F1A14";
const INK_700   = "#3D362F";
const INK_500   = "#6B6258";
const GOLD      = "#C9A96E";
const ON_DARK   = "#FBF7EE";
const RULE      = "rgba(31,26,20,0.12)";
const RULE_D    = "rgba(248,243,232,0.18)";

const FH = "var(--font-barlow-condensed),'Barlow Condensed',sans-serif";
const FB = "var(--font-barlow),'Barlow',sans-serif";

/* ─── Content ───────────────────────────────────────────────── */
const GALLERY = [
  {
    id: "exterior",
    label: "Exterior Rendering",
    caption: "Final form — dark metal facade cladding, high-performance Low-E glass, rooftop padel court, solar array & custom gold Shumul Center signage. Berqayel, Akkar.",
    src: "/gallery/exterior.jpg",
  },
  {
    id: "design-process",
    label: "Design Process & Development",
    caption: "Site analysis, 3D massing studies, spatial floor plan layouts & material exploration — from concept to final form. October 2024.",
    src: "/gallery/design-process.jpg",
  },
];

const PILLARS = [
  { n: "01", title: "Media Production",
    desc: "Broadcast-quality studios for radio, podcast & video — serving independent journalists and community media across Akkar." },
  { n: "02", title: "Youth Empowerment",
    desc: "Trainings, workshops & mentorship programs tailored for young people in North Lebanon's most underserved region." },
  { n: "03", title: "NGO Field Presence",
    desc: "Secure, professional offices for UN agencies, INGOs & local civil society organizations working in the field." },
  { n: "04", title: "Safe & Confidential Services",
    desc: "SRHR, psychosocial support & private consultations — meeting international donor security and confidentiality standards." },
];

const SUSTAINABILITY = [
  { n: "01", title: "Solar Energy",
    desc: "Rooftop PV + Battery ESS + backup generator for 24/7 continuity — eliminating grid dependence entirely." },
  { n: "02", title: "Smart Lighting",
    desc: "Full LED with occupancy sensors & smart controls — dramatically reducing energy consumption." },
  { n: "03", title: "Water Harvesting",
    desc: "Rainwater collection for irrigation & cleaning — addressing Akkar's seasonal water scarcity." },
  { n: "04", title: "Bioclimatic Design",
    desc: "Natural shading, cross-ventilation & low-carbon local materials woven into the architecture." },
  { n: "05", title: "Reduced HVAC Load",
    desc: "Recessed facades & high-performance Low-E glass cut direct glare and thermal gain significantly." },
  { n: "06", title: "Net-Zero Target",
    desc: "Operational carbon net-zero goal — a replicable demonstration model for the region." },
];

const SECURITY = [
  { n: "01", title: "Physical Security",
    desc: "Full perimeter wall, controlled entry/exit gates & security guard posts." },
  { n: "02", title: "Access Control",
    desc: "RFID/Smart Card system with tiered floor-by-zone access & visitor logging." },
  { n: "03", title: "CCTV Coverage",
    desc: "Full public-area coverage — no cameras inside confidential zones." },
  { n: "04", title: "Central Control Room",
    desc: "Live monitoring, recorded storage, systems management & ACTS Codes compliance." },
];

const REVENUE = [
  { n: "01", title: "Event Hall Rentals",        desc: "NGO conferences, community trainings & cultural events" },
  { n: "02", title: "Co-Working & Office Leasing", desc: "Long & short-term desk and office leases" },
  { n: "03", title: "Media Production Services",  desc: "Studio, equipment & production rental" },
  { n: "04", title: "Café Operations",            desc: "Daily community revenue — inclusive menu options" },
  { n: "05", title: "Naming Rights & Partnerships", desc: "Rooms, studios, floors — CSR & institutional partnerships" },
  { n: "06", title: "Safe Room Hosting",          desc: "INGO partnership revenue (UN, IRC, UNFPA)" },
];

const SDGS = [
  { n: "04", label: "Quality Education" },
  { n: "05", label: "Gender Equality" },
  { n: "06", label: "Clean Water" },
  { n: "07", label: "Clean Energy" },
  { n: "10", label: "Reduced Inequalities" },
  { n: "16", label: "Strong Institutions" },
  { n: "17", label: "Partnerships" },
];

/* ─── Shared atoms ──────────────────────────────────────────── */
function Eyebrow({ children, onDark = false, center = false }: { children: React.ReactNode; onDark?: boolean; center?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}
      style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: onDark ? TERRA_300 : TERRA }}
    >
      <span style={{ width: 30, height: 1.5, background: "currentColor", flexShrink: 0 }} />
      {children}
      {center && <span style={{ width: 30, height: 1.5, background: "currentColor", flexShrink: 0 }} />}
    </div>
  );
}

function H2({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <h2
      className="text-4xl md:text-5xl"
      style={{ fontFamily: FH, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.04, color: onDark ? ON_DARK : INK_900 }}
    >
      {children}
    </h2>
  );
}

function NumBadge({ n, onDark = false }: { n: string; onDark?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: 40, height: 40,
        fontFamily: FH, fontWeight: 700, fontSize: 17,
        color: onDark ? TERRA_300 : TERRA,
        border: `1px solid ${onDark ? RULE_D : RULE}`,
        background: onDark ? "rgba(248,243,232,0.05)" : BEIGE_300,
      }}
    >
      {n}
    </span>
  );
}

/* ─── Gallery ───────────────────────────────────────────────── */
function Gallery() {
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const cur = GALLERY[active];

  return (
    <div className="space-y-4">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9", background: OLIVE_700, borderRadius: 4 }}>
        {!errored[active] && (
          <img
            key={active}
            src={cur.src}
            alt={cur.label}
            onError={() => setErrored((p) => ({ ...p, [active]: true }))}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-x-0 bottom-0 px-6 pb-5 pt-14"
          style={{ background: "linear-gradient(to top, rgba(31,26,20,0.92) 0%, transparent 100%)" }}
        >
          <p className="mb-1" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD }}>
            {String(active + 1).padStart(2, "0")} / {GALLERY.length} — {cur.label}
          </p>
          <p style={{ fontFamily: FB, fontSize: 14, color: ON_DARK, maxWidth: 640 }}>{cur.caption}</p>
        </div>
        {errored[active] && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p style={{ fontFamily: FH, fontSize: 64, fontWeight: 700, color: "rgba(248,243,232,0.14)" }}>
              {String(active + 1).padStart(2, "0")}
            </p>
            <p style={{ fontFamily: FB, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(248,243,232,0.5)" }}>{cur.label}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {GALLERY.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActive(i)}
            className="relative overflow-hidden transition-all"
            style={{
              aspectRatio: "4/3",
              borderRadius: 3,
              border: `2px solid ${active === i ? TERRA : "transparent"}`,
              background: OLIVE_700,
            }}
          >
            {!errored[i] && (
              <img
                src={item.src}
                alt={item.label}
                onError={() => setErrored((p) => ({ ...p, [i]: true }))}
                className="absolute inset-0 h-full w-full object-cover transition-opacity"
                style={{ opacity: active === i ? 1 : 0.72 }}
              />
            )}
            <div className="absolute bottom-0 left-0 px-3 py-2" style={{ background: "rgba(31,26,20,0.75)" }}>
              <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: active === i ? TERRA_300 : "rgba(248,243,232,0.7)" }}>
                {String(i + 1).padStart(2, "0")} · {item.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ShumulHubPage() {
  return (
    <div className="min-h-screen" style={{ background: BEIGE_300, color: INK_900 }}>
      <ShumulTopNav />

      {/* ── Hub header ── */}
      <header
        className="sticky z-40"
        style={{ top: 0, background: "rgba(251,247,238,0.94)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${RULE}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <ShumulLogo size={36} variant="light" />
            <div>
              <p style={{ fontFamily: FH, fontWeight: 700, fontSize: 17, lineHeight: 1.1, color: INK_900 }}>
                Shumul <span style={{ color: OLIVE_600 }}>شمول</span>
              </p>
              <p style={{ fontFamily: FB, fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: INK_500 }}>
                Community & Media Hub · Akkar
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-7 md:flex">
            {[
              ["#vision", "Vision"],
              ["#gallery", "Drawings"],
              ["#sustainability", "Sustainability"],
              ["#location", "Location"],
              ["#support", "Support"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="transition-colors"
                style={{ fontFamily: FB, fontSize: 13, fontWeight: 500, color: INK_700 }}
                onMouseOver={(e) => (e.currentTarget.style.color = TERRA)}
                onMouseOut={(e) => (e.currentTarget.style.color = INK_700)}
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#support"
            className="px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ fontFamily: FB, background: OLIVE_600, color: ON_DARK, borderRadius: 2 }}
          >
            Support the Hub
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: OLIVE_700 }} className="px-6 pb-10 pt-14 md:pb-16 md:pt-20">
        <div className="mx-auto w-full max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            {/* Copy */}
            <div>
              <p className="mb-5" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: TERRA_300 }}>
                Berqayel, Akkar · North Lebanon · Est. 2022
              </p>
              <h1
                className="mb-6 text-5xl md:text-7xl"
                style={{ fontFamily: FH, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.015em", color: ON_DARK }}
              >
                A Hub for<br />
                <span style={{ color: TERRA_300 }}>Community,</span><br />
                Media & Impact.
              </h1>
              <p className="mb-8 max-w-md" style={{ fontFamily: FB, fontSize: 15.5, lineHeight: 1.65, color: "rgba(248,243,232,0.72)" }}>
                Shumul is building a 6-level integrated community and media center in Akkar —
                designed to international donor standards with broadcast studios, co-working spaces,
                youth programs, confidential support services & net-zero energy systems.
              </p>

              <div className="mb-10 flex flex-wrap gap-3">
                <a
                  href="#support"
                  className="px-6 py-3.5 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{ fontFamily: FB, background: TERRA, color: "#fff", borderRadius: 2 }}
                >
                  Support the Project
                </a>
                <a
                  href="#gallery"
                  className="px-6 py-3.5 text-sm font-semibold transition-colors"
                  style={{ fontFamily: FB, border: `1px solid ${RULE_D}`, color: ON_DARK, borderRadius: 2 }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = TERRA_300; e.currentTarget.style.color = TERRA_300; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = RULE_D; e.currentTarget.style.color = ON_DARK; }}
                >
                  View Drawings
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 border-t pt-7" style={{ borderColor: RULE_D }}>
                {[
                  { n: "6", l: "Levels" },
                  { n: "1,000m²", l: "Site Area" },
                  { n: "4", l: "Program Pillars" },
                ].map(({ n, l }) => (
                  <div key={l}>
                    <p style={{ fontFamily: FH, fontWeight: 700, fontSize: 30, color: GOLD, lineHeight: 1 }}>{n}</p>
                    <p className="mt-1.5" style={{ fontFamily: FB, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(248,243,232,0.55)" }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3D model viewer */}
            <div>
              <div
                className="overflow-hidden"
                style={{ height: "min(58vh, 560px)", minHeight: 420, borderRadius: 4, border: `1px solid ${RULE_D}`, boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}
              >
                <Building3D />
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <p style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(248,243,232,0.5)" }}>
                  Interactive Model — Shumul Center
                </p>
                <p style={{ fontFamily: FB, fontSize: 11, color: "rgba(248,243,232,0.4)" }}>
                  drag to orbit · scroll to zoom
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Vision ── */}
      <section id="vision" className="px-6 py-24" style={{ background: BEIGE_300 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow center>Our Vision</Eyebrow>
          <div className="mx-auto max-w-3xl py-12 text-center">
            <blockquote style={{ fontFamily: FH, fontWeight: 600, fontSize: "clamp(22px,3vw,30px)", lineHeight: 1.35, color: INK_900 }}>
              &ldquo;The Shumul Hub is designed not only as a media production space, but as a
              secure, sustainable, and fully equipped community infrastructure that can host programs
              related to media, civic engagement, storytelling, and sensitive social support
              services — <span style={{ color: TERRA }}>built for and by the people of Akkar.</span>&rdquo;
            </blockquote>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="p-7"
                style={{ background: BEIGE_200, border: `1px solid ${RULE}`, borderRadius: 3, boxShadow: "0 1px 3px rgba(31,26,20,0.05)" }}
              >
                <NumBadge n={n} />
                <h3 className="mb-2 mt-5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 19, color: INK_900 }}>{title}</h3>
                <p style={{ fontFamily: FB, fontSize: 13.5, lineHeight: 1.6, color: INK_500 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="px-6 py-24" style={{ background: BEIGE_400 }}>
        <div className="mx-auto max-w-5xl">
          <Eyebrow center>Architectural Drawings</Eyebrow>
          <div className="my-10 text-center">
            <H2>Designed for Purpose</H2>
            <p className="mx-auto mt-4 max-w-xl" style={{ fontFamily: FB, fontSize: 14.5, lineHeight: 1.6, color: INK_500 }}>
              Six levels of thoughtfully designed space — from broadcast studios to confidential support rooms.
            </p>
          </div>
          <Gallery />
        </div>
      </section>

      {/* ── Sustainability ── */}
      <section id="sustainability" className="px-6 py-24" style={{ background: OLIVE_700 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow onDark center>Sustainability</Eyebrow>
          <div className="my-10 text-center">
            <H2 onDark>Net-Zero by Design</H2>
            <p className="mx-auto mt-4 max-w-xl" style={{ fontFamily: FB, fontSize: 14.5, lineHeight: 1.6, color: "rgba(248,243,232,0.65)" }}>
              A demonstration model for sustainable community infrastructure — built for Lebanon&apos;s
              energy reality and designed to outlast it.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SUSTAINABILITY.map(({ n, title, desc }) => (
              <div
                key={n}
                className="p-7"
                style={{ background: "rgba(248,243,232,0.05)", border: `1px solid ${RULE_D}`, borderRadius: 3 }}
              >
                <NumBadge n={n} onDark />
                <h3 className="mb-2 mt-5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 19, color: ON_DARK }}>{title}</h3>
                <p style={{ fontFamily: FB, fontSize: 13.5, lineHeight: 1.6, color: "rgba(248,243,232,0.62)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Underground ── */}
      <section className="px-6 py-24" style={{ background: BEIGE_300 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow center>Underground Infrastructure</Eyebrow>
          <div className="my-10 grid gap-6 md:grid-cols-2">
            <div className="p-9" style={{ background: BEIGE_200, border: `1px solid ${RULE}`, borderRadius: 3 }}>
              <p className="mb-3" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: OLIVE_500 }}>
                Basement B1
              </p>
              <h3 className="mb-5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 26, color: INK_900 }}>
                Services & Parking
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Parking for 20–30 cars with RFID-controlled gates",
                  "Server & IT infrastructure rooms",
                  "Electrical distribution & battery storage systems",
                  "Building archives & maintenance rooms",
                ].map((item) => (
                  <li key={item} className="flex gap-3" style={{ fontFamily: FB, fontSize: 13.5, lineHeight: 1.55, color: INK_700 }}>
                    <span style={{ color: OLIVE_400, flexShrink: 0, marginTop: 1 }}>—</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-9" style={{ background: BEIGE_200, border: `2px solid ${TERRA}`, borderRadius: 3, boxShadow: "0 4px 24px rgba(199,107,74,0.12)" }}>
              <p className="mb-3" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: TERRA }}>
                Basement B2 — Key Donor Eligibility
              </p>
              <h3 className="mb-5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 26, color: INK_900 }}>
                Safe & Confidential Rooms
              </h3>
              <ul className="space-y-2.5">
                {[
                  "Psychosocial support session rooms",
                  "SRHR program delivery spaces",
                  "Private consultation & case management offices",
                  "Beneficiary intake rooms — fully confidential access",
                  "No CCTV inside — SOPs & data protection enforced",
                ].map((item) => (
                  <li key={item} className="flex gap-3" style={{ fontFamily: FB, fontSize: 13.5, lineHeight: 1.55, color: INK_700 }}>
                    <span style={{ color: TERRA, flexShrink: 0, marginTop: 1 }}>—</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="px-6 py-24" style={{ background: BEIGE_400 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow center>Security & Access Control</Eyebrow>
          <div className="my-10 text-center">
            <H2>Donor-Standard Security</H2>
            <p className="mx-auto mt-4 max-w-xl" style={{ fontFamily: FB, fontSize: 14.5, lineHeight: 1.6, color: INK_500 }}>
              Built to meet the protocols required by UN agencies, INGOs & international donors
              operating in sensitive contexts.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {SECURITY.map(({ n, title, desc }) => (
              <div key={n} className="p-7 text-center" style={{ background: BEIGE_200, border: `1px solid ${RULE}`, borderRadius: 3 }}>
                <div className="flex justify-center"><NumBadge n={n} /></div>
                <h3 className="mb-2 mt-5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 18, color: INK_900 }}>{title}</h3>
                <p style={{ fontFamily: FB, fontSize: 13, lineHeight: 1.6, color: INK_500 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section id="location" className="px-6 py-24" style={{ background: BEIGE_300 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Location</Eyebrow>
          <div className="my-10 grid items-center gap-12 md:grid-cols-2">
            <div>
              <H2>
                Berqayel, Akkar<br />
                <span style={{ color: TERRA }}>North Lebanon</span>
              </H2>
              <p className="mb-7 mt-5 max-w-md" style={{ fontFamily: FB, fontSize: 14.5, lineHeight: 1.65, color: INK_700 }}>
                Located in Berqayel (Barkaïl), one of Lebanon&apos;s most underserved districts —
                among the highest poverty rates in the country with limited access to media,
                civic infrastructure & social services. Shumul is built here intentionally.
              </p>
              <div className="space-y-3.5">
                {[
                  ["Site Area", "1,000 m² — fully enclosed"],
                  ["Frontage", "20 m on main road"],
                  ["Parking", "20–30 cars, B1 basement"],
                  ["Status", "Site already secured"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-5 border-b pb-3" style={{ borderColor: "rgba(31,26,20,0.06)" }}>
                    <span className="w-24 shrink-0" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: TERRA }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: FB, fontSize: 14.5, fontWeight: 500, color: INK_900 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-center"
              style={{ height: 320, background: OLIVE_700, borderRadius: 4 }}
            >
              <div className="text-center">
                <div className="flex justify-center"><ShumulLogo size={64} variant="dark" /></div>
                <p className="mt-5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 22, color: ON_DARK }}>
                  Berqayel · Akkar
                </p>
                <p className="mt-1" style={{ fontFamily: FB, fontSize: 12, letterSpacing: "0.14em", color: "rgba(248,243,232,0.55)" }}>
                  34.5497° N · 36.2756° E
                </p>
                <p className="mt-4" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: GOLD }}>
                  North Lebanon
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Revenue ── */}
      <section className="px-6 py-24" style={{ background: OLIVE_700 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow onDark center>Revenue Model</Eyebrow>
          <div className="my-10 text-center">
            <H2 onDark>Six Revenue Streams</H2>
            <p className="mx-auto mt-4 max-w-xl" style={{ fontFamily: FB, fontSize: 14.5, color: "rgba(248,243,232,0.65)" }}>
              Designed for long-term financial sustainability beyond grant funding.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {REVENUE.map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex items-start gap-5 p-6"
                style={{ background: "rgba(248,243,232,0.05)", border: `1px solid ${RULE_D}`, borderRadius: 3 }}
              >
                <span className="shrink-0" style={{ fontFamily: FH, fontWeight: 700, fontSize: 26, color: GOLD, lineHeight: 1 }}>
                  {n}
                </span>
                <div>
                  <h3 className="mb-1.5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 18, color: ON_DARK }}>{title}</h3>
                  <p style={{ fontFamily: FB, fontSize: 13, lineHeight: 1.55, color: "rgba(248,243,232,0.6)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDGs ── */}
      <section className="px-6 py-24" style={{ background: BEIGE_300 }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow center>UN Sustainable Development Goals</Eyebrow>
          <div className="my-10 text-center">
            <H2>Aligned with 7 SDGs</H2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {SDGS.map(({ n, label }) => (
              <div
                key={n}
                className="flex min-w-28 flex-col items-center gap-1 p-5 text-center"
                style={{ background: BEIGE_200, border: `1px solid ${RULE}`, borderRadius: 3 }}
              >
                <span style={{ fontFamily: FB, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: TERRA }}>SDG</span>
                <span style={{ fontFamily: FH, fontWeight: 700, fontSize: 34, color: INK_900, lineHeight: 1 }}>{n}</span>
                <span style={{ fontFamily: FB, fontSize: 11, lineHeight: 1.35, color: INK_500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="support" className="px-6 py-28" style={{ background: TERRA }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5" style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
            Support the Shumul Hub
          </p>
          <h2
            className="mb-7 text-5xl md:text-6xl"
            style={{ fontFamily: FH, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.01em", color: "#fff" }}
          >
            Help Build Lebanon&apos;s<br />Most Ambitious<br />Community Hub.
          </h2>
          <p className="mx-auto mb-12 max-w-xl" style={{ fontFamily: FB, fontSize: 15.5, lineHeight: 1.65, color: "rgba(255,255,255,0.82)" }}>
            We are seeking direct contributions, in-kind support, naming rights & long-term
            lease agreements. Every partnership brings this vision closer to the communities of Akkar.
          </p>

          <div className="mx-auto mb-12 grid max-w-2xl gap-4 md:grid-cols-3">
            {[
              ["Direct Funding", "Financial contributions to construction & fit-out"],
              ["In-Kind Support", "Equipment, furniture & technical resources"],
              ["Naming Rights", "Studios, offices, floors — put your name on the map"],
            ].map(([title, desc]) => (
              <div key={title} className="p-5 text-left" style={{ background: "rgba(255,255,255,0.14)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.2)" }}>
                <h4 className="mb-1.5" style={{ fontFamily: FH, fontWeight: 700, fontSize: 17, color: "#fff" }}>{title}</h4>
                <p style={{ fontFamily: FB, fontSize: 12.5, lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>{desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:omar.khaled@spotcast.press"
              className="px-8 py-4 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ fontFamily: FB, background: OLIVE_700, color: ON_DARK, borderRadius: 2 }}
            >
              omar.khaled@spotcast.press
            </a>
            <a
              href="tel:+96176538270"
              className="px-8 py-4 text-sm font-bold transition-colors"
              style={{ fontFamily: FB, border: "1px solid rgba(255,255,255,0.45)", color: "#fff", borderRadius: 2 }}
              onMouseOver={(e) => (e.currentTarget.style.background = TERRA_600)}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              +961 76 538 270
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-12" style={{ background: OLIVE_700, borderTop: `1px solid ${RULE_D}` }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <ShumulLogo size={34} variant="dark" />
            <div>
              <p style={{ fontFamily: FH, fontWeight: 700, fontSize: 15, color: ON_DARK }}>Shumul شمول</p>
              <p style={{ fontFamily: FB, fontSize: 11, letterSpacing: "0.1em", color: "rgba(248,243,232,0.55)" }}>
                Community & Media Hub · Berqayel, Akkar
              </p>
            </div>
          </div>
          <p style={{ fontFamily: FB, fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(248,243,232,0.45)" }}>
            A SpotCast Initiative · Est. 2022 · North Lebanon
          </p>
          <div className="flex flex-wrap gap-6">
            {[
              ["mailto:omar.khaled@spotcast.press", "omar.khaled@spotcast.press"],
              ["tel:+96176538270", "+961 76 538 270"],
              ["https://spotcast.press", "spotcast.press"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="transition-colors"
                style={{ fontFamily: FB, fontSize: 12, color: "rgba(248,243,232,0.6)" }}
                onMouseOver={(e) => (e.currentTarget.style.color = TERRA_300)}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(248,243,232,0.6)")}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
