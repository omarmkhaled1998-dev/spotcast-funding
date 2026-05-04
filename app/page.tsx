"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SpotCastLogo } from "@/components/hub/SpotCastLogo";

const Building3D = dynamic(() => import("@/components/hub/Building3D"), { ssr: false });

/* ─── Brand ─────────────────────────────────────────────────── */
const NAVY = "#0e2334";
const PINK = "#dd7c99";
const GRAY = "#839ba3";
const LIGHT = "#f5f3f0";

/* ─── Data ─────────────────────────────────────────────────── */

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
  {
    icon: "📡",
    title: "Media Production",
    desc: "Broadcast-quality studios for radio, podcast & video — serving independent journalists and community media across Akkar.",
  },
  {
    icon: "🌱",
    title: "Youth Empowerment",
    desc: "Trainings, workshops & mentorship programs tailored for young people in North Lebanon's most underserved region.",
  },
  {
    icon: "🤝",
    title: "NGO Field Presence",
    desc: "Secure, professional offices for UN agencies, INGOs & local civil society organizations working in the field.",
  },
  {
    icon: "🔐",
    title: "Safe & Confidential Services",
    desc: "SRHR, psychosocial support & private consultations — meeting international donor security and confidentiality standards.",
  },
];

const SUSTAINABILITY = [
  {
    icon: "☀️",
    title: "Solar Energy",
    desc: "Rooftop PV + Battery ESS + backup generator for 24/7 continuity — eliminating grid dependence entirely.",
  },
  {
    icon: "💡",
    title: "Smart Lighting",
    desc: "Full LED with occupancy sensors & smart controls — dramatically reducing energy consumption.",
  },
  {
    icon: "💧",
    title: "Water Harvesting",
    desc: "Rainwater collection for irrigation & cleaning — addressing Akkar's seasonal water scarcity.",
  },
  {
    icon: "🌬️",
    title: "Bioclimatic Design",
    desc: "Natural shading, cross-ventilation & low-carbon local materials woven into the architecture.",
  },
  {
    icon: "🌡️",
    title: "Reduced HVAC Load",
    desc: "Recessed facades & high-performance Low-E glass cut direct glare and thermal gain significantly.",
  },
  {
    icon: "🎯",
    title: "Net-Zero Target",
    desc: "Operational carbon net-zero goal — a replicable demonstration model for the region.",
  },
];

const SECURITY = [
  {
    icon: "🔒",
    title: "Physical Security",
    desc: "Full perimeter wall, controlled entry/exit gates & security guard posts.",
  },
  {
    icon: "🪪",
    title: "Access Control",
    desc: "RFID/Smart Card system with tiered floor-by-zone access & visitor logging.",
  },
  {
    icon: "📷",
    title: "CCTV Coverage",
    desc: "Full public-area coverage — NO cameras inside confidential zones.",
  },
  {
    icon: "🖥️",
    title: "Central Control Room",
    desc: "Live monitoring, recorded storage, systems management & ACTS Codes compliance.",
  },
];

const REVENUE = [
  { n: "01", title: "Event Hall Rentals", desc: "NGO conferences, community trainings & cultural events" },
  { n: "02", title: "Co-Working & Office Leasing", desc: "Long & short-term desk and office leases" },
  { n: "03", title: "Media Production Services", desc: "Studio, equipment & production rental" },
  { n: "04", title: "Café Operations", desc: "Daily community revenue — inclusive menu options" },
  { n: "05", title: "Naming Rights & Partnerships", desc: "Rooms, studios, floors — CSR & institutional partnerships" },
  { n: "06", title: "Safe Room Hosting", desc: "INGO partnership revenue (UN, IRC, UNFPA)" },
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

/* ─── Gallery Component ────────────────────────────────────── */
function Gallery() {
  const [active, setActive] = useState(0);
  const [errored, setErrored] = useState<Record<number, boolean>>({});
  const cur = GALLERY[active];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative w-full rounded-xl overflow-hidden"
        style={{ aspectRatio: "16/9", background: NAVY }}
      >
        {!errored[active] && (
          <img
            key={active}
            src={cur.src}
            alt={cur.label}
            onError={() => setErrored((p) => ({ ...p, [active]: true }))}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Caption overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-10"
          style={{ background: "linear-gradient(to top, rgba(14,35,52,0.95) 0%, transparent 100%)" }}
        >
          <p className="text-xs mb-1" style={{ color: PINK, fontFamily: "monospace" }}>
            {String(active + 1).padStart(2, "0")} / {GALLERY.length} — {cur.label}
          </p>
          <p className="text-sm text-white">{cur.caption}</p>
        </div>

        {/* Fallback when image errors */}
        {errored[active] && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <p className="text-5xl font-bold" style={{ color: "rgba(221,124,153,0.15)", fontFamily: "monospace" }}>
              {String(active + 1).padStart(2, "0")}
            </p>
            <p className="text-xs" style={{ color: GRAY, fontFamily: "monospace" }}>{cur.label}</p>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-2 gap-3">
        {GALLERY.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActive(i)}
            className="relative rounded-lg overflow-hidden transition-all"
            style={{
              aspectRatio: "4/3",
              border: `2px solid ${active === i ? PINK : "transparent"}`,
              background: NAVY,
            }}
          >
            {!errored[i] && (
              <img
                src={item.src}
                alt={item.label}
                onError={() => setErrored((p) => ({ ...p, [i]: true }))}
                className="absolute inset-0 w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold" style={{ fontFamily: "monospace", color: active === i ? PINK : GRAY }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Divider ──────────────────────────────────────────────── */
function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: `${PINK}30` }} />
      {label && (
        <span className="text-xs tracking-widest uppercase" style={{ color: PINK, fontFamily: "monospace" }}>
          {label}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: `${PINK}30` }} />
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function ShumulHubPage() {
  return (
    <div className="min-h-screen" style={{ background: "#fff", color: NAVY }}>

      {/* ── Nav ────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ background: "rgba(255,255,255,0.95)", borderBottom: `1px solid ${PINK}22` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={38} variant="color" />
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: NAVY }}>Shumul شمول</p>
              <p className="text-xs leading-tight" style={{ color: GRAY, fontFamily: "monospace" }}>Community & Media Hub · Akkar</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 md:flex" style={{ fontFamily: "monospace", fontSize: "12px" }}>
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
                className="transition-colors hover:text-[#dd7c99]"
                style={{ color: GRAY }}
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#support"
            className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: PINK }}
          >
            Support the Hub
          </a>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{ background: NAVY, minHeight: "92vh" }} className="flex items-center px-6 py-16">
        <div className="mx-auto w-full max-w-6xl grid gap-8 md:grid-cols-2 items-center">

          {/* Text */}
          <div className="text-white">
            <p className="mb-4 text-xs tracking-widest uppercase" style={{ color: PINK, fontFamily: "monospace" }}>
              Berqayel, Akkar · North Lebanon · Est. 2022
            </p>
            <h1 className="text-5xl font-bold leading-tight mb-2 md:text-6xl" style={{ fontFamily: "Georgia, serif" }}>
              Shumul
            </h1>
            <h2 className="text-3xl font-bold leading-tight mb-6 md:text-4xl" style={{ fontFamily: "Georgia, serif" }}>
              A Hub for <span style={{ color: PINK }}>Community,</span><br />
              Media &amp; Impact.
            </h2>
            <p className="mb-8 text-base leading-relaxed max-w-md" style={{ color: GRAY }}>
              Shumul is building a 6-level integrated community and media center in Akkar —
              designed to international donor standards with broadcast studios, co-working spaces,
              youth programs, confidential support services &amp; net-zero energy systems.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <a
                href="#support"
                className="rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: PINK }}
              >
                Support the Project
              </a>
              <a
                href="#gallery"
                className="rounded-full px-6 py-3 text-sm font-semibold transition-colors"
                style={{ border: `1px solid ${GRAY}`, color: GRAY }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = PINK; e.currentTarget.style.color = PINK; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY; }}
              >
                View Drawings
              </a>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { n: "6", l: "Floors" },
                { n: "1,000m²", l: "Site Area" },
                { n: "4", l: "Pillars" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <p className="text-2xl font-bold" style={{ color: PINK, fontFamily: "Georgia, serif" }}>{n}</p>
                  <p className="text-xs tracking-wider" style={{ color: GRAY, fontFamily: "monospace" }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Building */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0a1825", height: 520 }}>
            <Building3D />
          </div>
        </div>
      </section>

      {/* ── Vision ─────────────────────────────────────────── */}
      <section id="vision" className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Our Vision" />
          <div className="mx-auto max-w-3xl py-12 text-center">
            <blockquote
              className="text-xl md:text-2xl font-medium leading-relaxed"
              style={{ fontFamily: "Georgia, serif", color: NAVY }}
            >
              &ldquo;The Shumul Hub is designed not only as a media production space, but as a
              secure, sustainable, and fully equipped community infrastructure that can host programs
              related to media, civic engagement, storytelling, and sensitive social support
              services — built for and by the people of Akkar.&rdquo;
            </blockquote>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {PILLARS.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-6 bg-white"
                style={{ boxShadow: `0 2px 16px ${NAVY}10`, border: `1px solid ${PINK}22` }}
              >
                <p className="text-3xl mb-3">{icon}</p>
                <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ────────────────────────────────────────── */}
      <section id="gallery" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <Divider label="Architectural Drawings" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              Designed for Purpose
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              Six levels of thoughtfully designed space — from broadcast studios to confidential support rooms.
            </p>
          </div>
          <Gallery />
        </div>
      </section>

      {/* ── Sustainability ─────────────────────────────────── */}
      <section id="sustainability" className="py-20 px-6" style={{ background: NAVY }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Sustainability" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl text-white" style={{ fontFamily: "Georgia, serif" }}>
              Net-Zero by Design
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              A demonstration model for sustainable community infrastructure — built for Lebanon&apos;s
              energy reality and designed to outlast it.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {SUSTAINABILITY.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-6"
                style={{ background: "#122033", border: `1px solid ${PINK}22` }}
              >
                <p className="text-3xl mb-3">{icon}</p>
                <h3 className="text-sm font-bold mb-2 text-white">{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Underground ────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Underground Infrastructure" />
          <div className="my-10 grid gap-6 md:grid-cols-2">
            {/* B1 */}
            <div
              className="rounded-xl p-8 bg-white"
              style={{ border: `1px solid ${PINK}22`, boxShadow: `0 2px 16px ${NAVY}08` }}
            >
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: PINK, fontFamily: "monospace" }}>
                Basement B1
              </p>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
                Services &amp; Parking
              </h3>
              <ul className="space-y-2">
                {[
                  "Parking for 20–30 cars with RFID-controlled gates",
                  "Server & IT infrastructure rooms",
                  "Electrical distribution & battery storage systems",
                  "Building archives & maintenance rooms",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-xs" style={{ color: GRAY }}>
                    <span style={{ color: PINK }}>●</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* B2 */}
            <div
              className="rounded-xl p-8 bg-white"
              style={{ border: `2px solid ${PINK}55`, boxShadow: `0 2px 24px ${PINK}12` }}
            >
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: PINK, fontFamily: "monospace" }}>
                Basement B2 — Key Donor Eligibility
              </p>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
                Safe &amp; Confidential Rooms
              </h3>
              <ul className="space-y-2">
                {[
                  "Psychosocial support session rooms",
                  "SRHR program delivery spaces",
                  "Private consultation & case management offices",
                  "Beneficiary intake rooms — fully confidential access",
                  "No CCTV inside — SOPs & data protection enforced",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-xs" style={{ color: GRAY }}>
                    <span style={{ color: PINK }}>●</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Security ───────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <Divider label="Security & Access Control" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              Donor-Standard Security
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              Built to meet the protocols required by UN agencies, INGOs & international donors
              operating in sensitive contexts.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {SECURITY.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl p-6 text-center"
                style={{ background: LIGHT, border: `1px solid ${PINK}22` }}
              >
                <p className="text-3xl mb-3">{icon}</p>
                <h3 className="text-sm font-bold mb-2" style={{ color: NAVY }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location ───────────────────────────────────────── */}
      <section id="location" className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Location" />
          <div className="my-10 grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold mb-4 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
                Berqayel, Akkar<br /><span style={{ color: PINK }}>North Lebanon</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: GRAY }}>
                Located in Berqayel (Barkaïl), one of Lebanon&apos;s most underserved districts —
                among the highest poverty rates in the country with limited access to media,
                civic infrastructure & social services. Shumul is built here intentionally.
              </p>
              <div className="space-y-3">
                {[
                  ["Site Area", "1,000 m² — fully enclosed"],
                  ["Frontage", "20 m on main road"],
                  ["Parking", "20–30 cars, B1 basement"],
                  ["Status", "Site already secured"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-4">
                    <span className="w-24 shrink-0 text-xs" style={{ fontFamily: "monospace", color: PINK }}>
                      {label}
                    </span>
                    <span className="text-sm font-medium" style={{ color: NAVY }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="rounded-xl flex items-center justify-center"
              style={{ height: 280, background: NAVY }}
            >
              <div className="text-center">
                <SpotCastLogo size={60} variant="white" />
                <p className="mt-3 text-xs" style={{ fontFamily: "monospace", color: GRAY }}>
                  Berqayel · Akkar · Lebanon
                </p>
                <p className="text-xs mt-1" style={{ fontFamily: "monospace", color: `${GRAY}60` }}>
                  34.5497° N, 36.2756° E
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Revenue ────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ background: NAVY }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="Revenue Model" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl text-white" style={{ fontFamily: "Georgia, serif" }}>
              Six Revenue Streams
            </h2>
            <p className="text-sm" style={{ color: GRAY }}>
              Designed for long-term financial sustainability beyond grant funding.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {REVENUE.map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex items-start gap-4 rounded-xl p-5"
                style={{ background: "#122033", border: `1px solid ${PINK}22` }}
              >
                <span className="shrink-0 text-xl font-bold" style={{ fontFamily: "monospace", color: PINK }}>
                  {n}
                </span>
                <div>
                  <h3 className="text-sm font-bold mb-1 text-white">{title}</h3>
                  <p className="text-xs" style={{ color: GRAY }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDGs ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <Divider label="UN Sustainable Development Goals" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3 md:text-4xl" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              Aligned with 7 SDGs
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {SDGS.map(({ n, label }) => (
              <div
                key={n}
                className="flex flex-col items-center gap-1 rounded-xl p-4 min-w-24 text-center"
                style={{ background: LIGHT, border: `1px solid ${PINK}33` }}
              >
                <span className="text-xs font-bold" style={{ fontFamily: "monospace", color: PINK }}>SDG</span>
                <span className="text-3xl font-bold" style={{ fontFamily: "Georgia, serif", color: NAVY }}>{n}</span>
                <span className="text-xs leading-tight" style={{ fontFamily: "monospace", color: GRAY }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section id="support" className="py-24 px-6" style={{ background: PINK }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs tracking-widest uppercase text-white/80" style={{ fontFamily: "monospace" }}>
            Support the Shumul Hub
          </p>
          <h2 className="text-4xl font-bold text-white mb-6 md:text-5xl" style={{ fontFamily: "Georgia, serif" }}>
            Help Build Lebanon&apos;s<br />Most Ambitious<br />Community Hub.
          </h2>
          <p className="text-base mb-10 max-w-xl mx-auto text-white/80 leading-relaxed">
            We are seeking direct contributions, in-kind support, naming rights &amp; long-term
            lease agreements. Every partnership brings this vision closer to the communities of Akkar.
          </p>
          <div className="grid gap-4 max-w-2xl mx-auto mb-10 md:grid-cols-3">
            {[
              ["Direct Funding", "Financial contributions to construction & fit-out"],
              ["In-Kind Support", "Equipment, furniture & technical resources"],
              ["Naming Rights", "Studios, offices, floors — put your name on the map"],
            ].map(([title, desc]) => (
              <div
                key={title}
                className="rounded-xl p-4 text-left"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
                <p className="text-xs text-white/75">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mb-6 text-sm text-white/80">
            Reach out directly — we respond within 24 hours.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="mailto:omar.khaled@spotcast.press"
              className="flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: NAVY, color: "#fff" }}
            >
              <span>✉</span>
              <span>omar.khaled@spotcast.press</span>
            </a>
            <a
              href="tel:+96176538270"
              className="flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.25)", color: "#fff" }}
            >
              <span>📞</span>
              <span>+961 76 538 270</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="px-6 py-10" style={{ background: NAVY, borderTop: `1px solid ${PINK}22` }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={32} variant="white" />
            <div>
              <p className="text-xs font-semibold text-white">Shumul شمول</p>
              <p className="text-xs" style={{ fontFamily: "monospace", color: GRAY }}>
                Community & Media Hub · Berqayel, Akkar
              </p>
            </div>
          </div>
          <p className="text-xs" style={{ fontFamily: "monospace", color: `${GRAY}80` }}>
            A SpotCast Initiative · Est. 2022 · North Lebanon
          </p>
          <div className="flex flex-wrap gap-5">
            {[
              ["mailto:omar.khaled@spotcast.press", "omar.khaled@spotcast.press"],
              ["tel:+96176538270", "+961 76 538 270"],
              ["https://spotcast.press", "spotcast.press"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-xs transition-colors"
                style={{ fontFamily: "monospace", color: GRAY }}
                onMouseOver={(e) => (e.currentTarget.style.color = PINK)}
                onMouseOut={(e) => (e.currentTarget.style.color = GRAY)}
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
