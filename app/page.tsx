"use client";

import { useState } from "react";

/* ─── Data ─────────────────────────────────────────────────────── */

const GALLERY = [
  {
    id: "exterior",
    label: "Exterior Rendering",
    caption:
      "Full building facade with solar roof, perimeter wall, olive-tree plaza, and custom signage finish",
    src: "/gallery/exterior.png",
    fallbackGradient: "linear-gradient(135deg, #1a1208 0%, #0e0c0a 100%)",
    fallbackAccent: "#d4832a",
  },
  {
    id: "design-process",
    label: "Design Process & Site Analysis",
    caption:
      "Berqayel site map, 3D massing iterations, material exploration, and facade detail development",
    src: "/gallery/design-process.png",
    fallbackGradient: "linear-gradient(135deg, #0f1a12 0%, #0e0c0a 100%)",
    fallbackAccent: "#5a8a40",
  },
  {
    id: "ground-floor",
    label: "Ground Floor — Community",
    caption:
      "Café, multi-purpose event hall, reception, and direct access to outdoor garden plaza",
    src: "/gallery/ground-floor.png",
    fallbackGradient: "linear-gradient(135deg, #14100c 0%, #0e0c0a 100%)",
    fallbackAccent: "#c07828",
  },
  {
    id: "first-floor",
    label: "1st Floor — Work",
    caption:
      "Co-working space, meeting room with large conference table, and 10 private offices in two corridors",
    src: "/gallery/first-floor.png",
    fallbackGradient: "linear-gradient(135deg, #0c1018 0%, #0e0c0a 100%)",
    fallbackAccent: "#4060a0",
  },
  {
    id: "second-floor",
    label: "2nd Floor — Media",
    caption:
      "Black radio studio, podcast studios, control room, editing suites, and director's suite",
    src: "/gallery/second-floor.png",
    fallbackGradient: "linear-gradient(135deg, #100c18 0%, #0e0c0a 100%)",
    fallbackAccent: "#6040a0",
  },
  {
    id: "floor-plans",
    label: "Floor Plans (2D)",
    caption:
      "Annotated ground, first, and second floor plans with room labels on A–D structural grid",
    src: "/gallery/floor-plans.png",
    fallbackGradient: "linear-gradient(135deg, #181410 0%, #0e0c0a 100%)",
    fallbackAccent: "#8a8070",
  },
];

const BUILDING_FLOORS = [
  {
    label: "Roof",
    tag: "Solar & Broadcast",
    color: "#d4832a",
    items: [
      "Solar PV panels + Battery ESS",
      "Radio broadcast antenna",
      "HVAC units",
      "Technical access",
    ],
    height: 44,
  },
  {
    label: "2nd Floor",
    tag: "Media Production",
    color: "#b87828",
    items: [
      "Radio studio (broadcast-quality)",
      "Podcast & video studios",
      "Editing suites & control room",
      "Director's office with private facilities",
    ],
    height: 58,
  },
  {
    label: "1st Floor",
    tag: "Work & Co-Working",
    color: "#a06820",
    items: [
      "10 private offices",
      "Co-working space",
      "Meeting room & Black Box room",
      "Kitchen & WC",
    ],
    height: 58,
  },
  {
    label: "Ground Floor",
    tag: "Community",
    color: "#885818",
    items: [
      "Multi-purpose event hall (~60 seats)",
      "Café (vegan & GF options)",
      "Reception & main entrance",
      "Garden & outdoor access",
    ],
    height: 58,
  },
  {
    label: "Basement B1",
    tag: "Services & Parking",
    color: "#704810",
    items: [
      "Parking: 20–30 cars (RFID gates)",
      "Server & IT infrastructure",
      "Electrical distribution & battery storage",
      "Archives & maintenance",
    ],
    height: 52,
  },
  {
    label: "Basement B2",
    tag: "Safe & Confidential",
    color: "#583808",
    items: [
      "Psychosocial support rooms",
      "SRHR program delivery spaces",
      "Case management offices",
      "Fully confidential — no CCTV inside",
    ],
    height: 52,
  },
];

const SUSTAINABILITY = [
  {
    icon: "☀️",
    title: "Solar Energy",
    desc: "Rooftop PV + Battery ESS + backup generator for 24/7 continuity — eliminating dependence on Lebanon's unreliable grid",
  },
  {
    icon: "💡",
    title: "Smart Lighting",
    desc: "Full LED system with occupancy sensors and smart control — dramatically reducing energy consumption",
  },
  {
    icon: "💧",
    title: "Water Harvesting",
    desc: "Rainwater collection system for irrigation and cleaning — addressing Akkar's seasonal water scarcity",
  },
  {
    icon: "🌬️",
    title: "Bioclimatic Design",
    desc: "Natural shading, cross-ventilation, and low-carbon local materials woven into the architectural form",
  },
  {
    icon: "🌡️",
    title: "Reduced HVAC Load",
    desc: "Recessed facades and high-performance Low-E glass cut direct glare and thermal gain significantly",
  },
  {
    icon: "🎯",
    title: "Net-Zero Target",
    desc: "Operational carbon net-zero goal — designed as a replicable demonstration model for the region",
  },
];

const SECURITY = [
  {
    icon: "🔒",
    title: "Physical Security",
    desc: "Full perimeter wall, controlled entry/exit gates, and security guard posts",
  },
  {
    icon: "🪪",
    title: "Access Control",
    desc: "RFID/Smart Card system, tiered floor-by-zone access, visitor logging",
  },
  {
    icon: "📷",
    title: "CCTV Coverage",
    desc: "Full public-area coverage (entrances, parking, corridors) — NO cameras inside confidential zones",
  },
  {
    icon: "🖥️",
    title: "Central Control Room",
    desc: "Live monitoring, recorded storage, systems management, ACTS Codes compliance, and SOPs",
  },
];

const REVENUE = [
  { n: "01", title: "Event Hall Rentals", desc: "NGO conferences, trainings, community events" },
  { n: "02", title: "Co-Working & Office Leasing", desc: "Long & short-term desk and office leases" },
  { n: "03", title: "Media Production Services", desc: "Studio, equipment, and production rental" },
  { n: "04", title: "Café Operations", desc: "Daily community revenue — vegan & GF options" },
  { n: "05", title: "Naming Rights & Partnerships", desc: "Rooms, studios, floors — CSR partnerships" },
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

const PILLARS = [
  {
    icon: "📡",
    title: "Media Production",
    desc: "Broadcast-quality studios for radio, podcast, and video — serving independent journalists and community media across Akkar",
  },
  {
    icon: "🌱",
    title: "Youth Empowerment",
    desc: "Trainings, workshops, and mentorship programs tailored for young people in North Lebanon's most underserved region",
  },
  {
    icon: "🤝",
    title: "NGO Field Presence",
    desc: "Secure, professional offices and co-working for UN agencies, INGOs, and local civil society organizations",
  },
  {
    icon: "🔐",
    title: "Safe & Confidential Services",
    desc: "SRHR, psychosocial support, and private consultations — meeting international donor security and data-protection standards",
  },
];

/* ─── Components ─────────────────────────────────────────────── */

function AmberDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1" style={{ height: "1px", background: "#2a2520" }} />
      <span
        className="flex items-center gap-2 text-xs tracking-widest"
        style={{ fontFamily: "monospace", color: "#d4832a" }}
      >
        <span>◆</span>
        {label && (
          <span style={{ color: "#8a8070" }} className="tracking-widest">
            {label}
          </span>
        )}
        <span>◆</span>
      </span>
      <div className="flex-1" style={{ height: "1px", background: "#2a2520" }} />
    </div>
  );
}

function Building3D() {
  const [activeFloor, setActiveFloor] = useState<number | null>(null);

  return (
    <div className="flex flex-col items-center">
      <div style={{ perspective: "900px", perspectiveOrigin: "50% 45%" }} className="w-full">
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(18deg) rotateY(-18deg)",
            margin: "0 auto",
            maxWidth: "340px",
          }}
        >
          {BUILDING_FLOORS.map((floor, i) => {
            const isActive = activeFloor === i;
            return (
              <div
                key={floor.label}
                onMouseEnter={() => setActiveFloor(i)}
                onMouseLeave={() => setActiveFloor(null)}
                style={{
                  height: `${floor.height}px`,
                  background: isActive
                    ? `linear-gradient(90deg, ${floor.color}28 0%, ${floor.color}10 100%)`
                    : i === 0
                    ? "#1e1a12"
                    : "#14100c",
                  borderTop: `1px solid ${isActive ? floor.color : "#2a2520"}`,
                  borderLeft: `3px solid ${floor.color}${isActive ? "ff" : "50"}`,
                  borderRight: `1px solid ${isActive ? floor.color + "60" : "#1e1a16"}`,
                  paddingLeft: "14px",
                  paddingRight: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background 0.18s ease, border-color 0.18s ease",
                }}
              >
                <span
                  style={{
                    color: isActive ? floor.color : "#4a4540",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    letterSpacing: "0.08em",
                    fontWeight: isActive ? "700" : "400",
                    transition: "color 0.18s",
                  }}
                >
                  {floor.label}
                </span>
                <span
                  style={{
                    color: isActive ? "#c8c0b0" : "#2e2a24",
                    fontSize: "10px",
                    fontFamily: "monospace",
                    transition: "color 0.18s",
                  }}
                >
                  {floor.tag}
                </span>
              </div>
            );
          })}
          {/* Base */}
          <div
            style={{
              height: "8px",
              background: "#1e1a12",
              borderBottom: "2px solid #3a3020",
              borderLeft: "3px solid #3a3020",
              borderRight: "1px solid #2a2520",
            }}
          />
        </div>
      </div>

      {/* Active floor detail */}
      <div
        style={{
          minHeight: "88px",
          opacity: activeFloor !== null ? 1 : 0,
          transition: "opacity 0.18s",
          marginTop: "20px",
          width: "100%",
          maxWidth: "340px",
        }}
      >
        {activeFloor !== null && (
          <div
            className="rounded p-4"
            style={{ border: `1px solid ${BUILDING_FLOORS[activeFloor].color}40`, background: "#12100e" }}
          >
            <p
              className="text-xs tracking-widest mb-2"
              style={{ fontFamily: "monospace", color: BUILDING_FLOORS[activeFloor].color }}
            >
              ◆ {BUILDING_FLOORS[activeFloor].tag.toUpperCase()}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {BUILDING_FLOORS[activeFloor].items.map((item) => (
                <p key={item} className="text-xs" style={{ color: "#8a8070" }}>
                  — {item}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Gallery() {
  const [active, setActive] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const current = GALLERY[active];
  const hasImage = !imgError[active];

  return (
    <div className="space-y-4">
      {/* Main display */}
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{
          aspectRatio: "16/9",
          border: "1px solid #2a2520",
          background: current.fallbackGradient,
        }}
      >
        {hasImage && (
          <img
            key={active}
            src={current.src}
            alt={current.label}
            onError={() => setImgError((prev) => ({ ...prev, [active]: true }))}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Label overlay — always visible */}
        <div
          className="absolute bottom-0 left-0 right-0 p-5"
          style={{
            background:
              "linear-gradient(to top, rgba(14,12,10,0.92) 0%, rgba(14,12,10,0.4) 70%, transparent 100%)",
          }}
        >
          <p
            className="text-xs tracking-widest uppercase mb-1"
            style={{ fontFamily: "monospace", color: current.fallbackAccent }}
          >
            ◆ {String(active + 1).padStart(2, "0")} / {GALLERY.length} — {current.label}
          </p>
          <p className="text-sm" style={{ color: "#c8c0b0" }}>
            {current.caption}
          </p>
        </div>

        {/* Fallback illustration when no image */}
        {!hasImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-8">
              <p
                className="text-4xl font-bold mb-2"
                style={{ fontFamily: "monospace", color: current.fallbackAccent + "30" }}
              >
                {String(active + 1).padStart(2, "0")}
              </p>
              <p
                className="text-xs tracking-widest"
                style={{ fontFamily: "monospace", color: "#2e2a24" }}
              >
                [ architectural drawing ]
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="grid grid-cols-6 gap-2">
        {GALLERY.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActive(i)}
            className="relative rounded overflow-hidden"
            style={{
              aspectRatio: "4/3",
              border: `1px solid ${active === i ? "#d4832a" : "#2a2520"}`,
              background: item.fallbackGradient,
              transition: "border-color 0.15s",
            }}
          >
            {!imgError[i] && (
              <img
                src={item.src}
                alt={item.label}
                onError={() => setImgError((prev) => ({ ...prev, [i]: true }))}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: active === i ? "transparent" : "rgba(14,12,10,0.4)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ fontFamily: "monospace", color: active === i ? "#d4832a" : "#4a4540" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */

export default function SpotCastHubPage() {
  return (
    <div style={{ background: "#0e0c0a", color: "#e8e0d0", minHeight: "100vh" }}>
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ borderBottom: "1px solid #1e1a16", background: "rgba(14,12,10,0.92)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded"
              style={{ width: 32, height: 32, background: "#d4832a" }}
            >
              <span
                className="text-xs font-bold"
                style={{ fontFamily: "monospace", color: "#0e0c0a" }}
              >
                SC
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
              >
                SpotCast
              </span>
              <span
                className="hidden text-xs md:inline"
                style={{ fontFamily: "monospace", color: "#4a4540" }}
              >
                Community &amp; Media Hub
              </span>
            </div>
          </div>

          <nav
            className="hidden items-center gap-6 md:flex"
            style={{ fontFamily: "monospace", fontSize: "11px", color: "#6a6060" }}
          >
            {[
              ["#vision", "Vision"],
              ["#gallery", "Drawings"],
              ["#building", "Building"],
              ["#sustainability", "Sustainability"],
              ["#location", "Location"],
              ["#support", "Support"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="transition-colors"
                style={{ color: "#6a6060" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#d4832a")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#6a6060")}
              >
                {label}
              </a>
            ))}
          </nav>

          <a
            href="#support"
            className="rounded px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
            style={{ fontFamily: "monospace", background: "#d4832a", color: "#0e0c0a" }}
          >
            Support the Project
          </a>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">
          {/* Text */}
          <div>
            <p
              className="mb-6 text-xs uppercase tracking-widest"
              style={{ fontFamily: "monospace", color: "#d4832a" }}
            >
              ◆ Berqayel, Akkar · North Lebanon · Est. 2022
            </p>

            <h1
              className="mb-6 text-5xl font-bold leading-tight md:text-6xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              A Hub for
              <br />
              <span style={{ color: "#d4832a" }}>Community,</span>
              <br />
              Media &amp; Impact.
            </h1>

            <p className="mb-8 max-w-md text-sm leading-relaxed" style={{ color: "#8a8070" }}>
              SpotCast is building a 6-level integrated community and media center in Akkar —
              designed to international donor standards, with broadcast studios, co-working space,
              confidential support services, and net-zero energy systems.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#support"
                className="rounded px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ fontFamily: "monospace", background: "#d4832a", color: "#0e0c0a" }}
              >
                Support the Project ◆
              </a>
              <a
                href="#gallery"
                className="rounded border px-6 py-3 text-sm transition-colors"
                style={{
                  fontFamily: "monospace",
                  borderColor: "#2a2520",
                  color: "#8a8070",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "#d4832a";
                  e.currentTarget.style.color = "#d4832a";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "#2a2520";
                  e.currentTarget.style.color = "#8a8070";
                }}
              >
                View Drawings
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { n: "6", label: "Floors" },
                { n: "1,000m²", label: "Site Area" },
                { n: "4", label: "Strategic Pillars" },
              ].map(({ n, label }) => (
                <div key={label}>
                  <p
                    className="text-2xl font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#d4832a" }}
                  >
                    {n}
                  </p>
                  <p
                    className="text-xs tracking-wider"
                    style={{ fontFamily: "monospace", color: "#6a6060" }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3D Building */}
          <Building3D />
        </div>
      </section>

      {/* ── Vision ──────────────────────────────────────────────── */}
      <section id="vision" className="px-6 py-20" style={{ background: "#0a0906" }}>
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="VISION" />

          <div className="mx-auto max-w-3xl py-14 text-center">
            <p
              className="mb-4 text-xs uppercase tracking-widest"
              style={{ fontFamily: "monospace", color: "#6a6060" }}
            >
              Positioning Statement
            </p>
            <blockquote
              className="text-xl leading-relaxed md:text-2xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              &ldquo;The SpotCast Hub is designed not only as a media production space, but as a
              secure, sustainable, and fully equipped community infrastructure that can host programs
              related to media, civic engagement, and sensitive social support services in
              Akkar.&rdquo;
            </blockquote>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {PILLARS.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg p-6"
                style={{ border: "1px solid #2a2520", background: "#0e0c0a" }}
              >
                <p className="mb-3 text-2xl">{icon}</p>
                <h3
                  className="mb-2 text-sm font-bold"
                  style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                >
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6a6060" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ─────────────────────────────────────────────── */}
      <section id="gallery" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <AmberDivider label="ARCHITECTURAL DRAWINGS" />

          <div className="my-12 text-center">
            <h2
              className="mb-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Designed for Purpose
            </h2>
            <p className="mx-auto max-w-xl text-sm" style={{ color: "#6a6060" }}>
              Six levels of thoughtfully designed space — from broadcast studios to confidential
              support rooms, community café to rooftop solar array.
            </p>
          </div>

          <Gallery />
        </div>
      </section>

      {/* ── Floor by Floor ──────────────────────────────────────── */}
      <section id="building" className="px-6 py-20" style={{ background: "#0a0906" }}>
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="FLOOR BY FLOOR" />

          <div className="my-12 text-center">
            <h2
              className="mb-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Six Levels of Impact
            </h2>
          </div>

          <div className="space-y-2">
            {BUILDING_FLOORS.map((floor) => (
              <div
                key={floor.label}
                className="group flex items-start gap-6 rounded-lg p-5 transition-all"
                style={{ border: "1px solid #2a2520", background: "#0e0c0a" }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = floor.color + "60";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2520";
                }}
              >
                <div
                  className="w-3 shrink-0 rounded-full"
                  style={{ background: floor.color, minHeight: "16px", marginTop: "2px" }}
                />
                <div className="flex-1">
                  <div className="mb-1 flex items-baseline gap-3">
                    <h3
                      className="text-sm font-bold"
                      style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                    >
                      {floor.label}
                    </h3>
                    <span
                      className="text-xs tracking-wider"
                      style={{ fontFamily: "monospace", color: floor.color }}
                    >
                      {floor.tag}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-0.5">
                    {floor.items.map((item) => (
                      <p key={item} className="text-xs" style={{ color: "#6a6060" }}>
                        — {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sustainability ───────────────────────────────────────── */}
      <section id="sustainability" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="SUSTAINABILITY" />

          <div className="my-12 text-center">
            <h2
              className="mb-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Net-Zero by Design
            </h2>
            <p className="mx-auto max-w-xl text-sm" style={{ color: "#6a6060" }}>
              A demonstration model for sustainable community infrastructure — built for Lebanon&apos;s
              energy reality and designed to outlast it.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {SUSTAINABILITY.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg p-6"
                style={{ border: "1px solid #2a2520", background: "#0a0906" }}
              >
                <p className="mb-4 text-3xl">{icon}</p>
                <h3
                  className="mb-2 text-sm font-bold"
                  style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                >
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6a6060" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Underground ─────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "#0a0906" }}>
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="UNDERGROUND INFRASTRUCTURE" />

          <div className="my-12 grid gap-6 md:grid-cols-2">
            {/* B1 */}
            <div
              className="rounded-lg p-8"
              style={{ border: "1px solid #2a2520", background: "#0e0c0a" }}
            >
              <p
                className="mb-4 text-xs tracking-widest"
                style={{ fontFamily: "monospace", color: "#d4832a" }}
              >
                ◆ BASEMENT B1
              </p>
              <h3
                className="mb-5 text-xl font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
              >
                Services &amp; Parking
              </h3>
              <ul className="space-y-2">
                {[
                  "Parking for 20–30 cars with RFID-controlled entry/exit",
                  "Server & IT infrastructure rooms",
                  "Electrical distribution & battery storage systems",
                  "Building archives & maintenance rooms",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#6a6060" }}>
                    <span style={{ color: "#d4832a" }}>◆</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* B2 */}
            <div
              className="rounded-lg p-8"
              style={{ border: "1px solid #d4832a30", background: "#0e0c0a" }}
            >
              <p
                className="mb-4 text-xs tracking-widest"
                style={{ fontFamily: "monospace", color: "#d4832a" }}
              >
                ◆ BASEMENT B2 — KEY DONOR ELIGIBILITY
              </p>
              <h3
                className="mb-5 text-xl font-bold"
                style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
              >
                Safe &amp; Confidential Rooms
              </h3>
              <ul className="space-y-2">
                {[
                  "Psychosocial support session rooms",
                  "SRHR program delivery spaces",
                  "Private consultation & case management offices",
                  "Beneficiary intake rooms — fully confidential access",
                  "No CCTV inside — SOPs & data protection policies enforced",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "#6a6060" }}>
                    <span style={{ color: "#d4832a" }}>◆</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div
                className="mt-5 pt-5"
                style={{ borderTop: "1px solid #2a2520" }}
              >
                <p className="text-xs" style={{ fontFamily: "monospace", color: "#6a6060" }}>
                  Target donors: UN agencies · GIZ · IRC · UNFPA
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="SECURITY & ACCESS CONTROL" />

          <div className="my-12 text-center">
            <h2
              className="mb-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Donor-Standard Security
            </h2>
            <p className="mx-auto max-w-xl text-sm" style={{ color: "#6a6060" }}>
              Built to meet the security protocols required by UN agencies, INGOs, and international
              donors operating in sensitive contexts.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-4">
            {SECURITY.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-lg p-6 text-center"
                style={{ border: "1px solid #2a2520", background: "#0a0906" }}
              >
                <p className="mb-3 text-3xl">{icon}</p>
                <h3
                  className="mb-2 text-sm font-bold"
                  style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                >
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6a6060" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location ────────────────────────────────────────────── */}
      <section id="location" className="px-6 py-20" style={{ background: "#0a0906" }}>
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="LOCATION" />

          <div className="my-12 grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2
                className="mb-5 text-3xl font-bold md:text-4xl"
                style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
              >
                Berqayel, Akkar
                <br />
                <span style={{ color: "#d4832a" }}>North Lebanon</span>
              </h2>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: "#6a6060" }}>
                Located in Berqayel (Barkaïl), one of Lebanon&apos;s most underserved districts. Akkar
                has among the highest poverty rates in the country with limited access to media
                resources, civic infrastructure, and social services — making this hub a
                transformative intervention.
              </p>
              <div className="space-y-3">
                {[
                  { label: "Site Area", value: "1,000 m² — fully enclosed" },
                  { label: "Frontage", value: "20 m on main road" },
                  { label: "Parking", value: "20–30 cars, B1 basement" },
                  { label: "Status", value: "Site already secured" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-baseline gap-4">
                    <span
                      className="w-24 shrink-0 text-xs"
                      style={{ fontFamily: "monospace", color: "#d4832a" }}
                    >
                      {label}
                    </span>
                    <span className="text-sm" style={{ color: "#c8c0b0" }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="flex items-center justify-center rounded-lg"
              style={{ height: 300, border: "1px solid #2a2520", background: "#0e0c0a" }}
            >
              <div className="text-center">
                <p
                  className="mb-2 text-xs tracking-widest"
                  style={{ fontFamily: "monospace", color: "#d4832a" }}
                >
                  ◆ MAP
                </p>
                <p
                  className="text-xs"
                  style={{ fontFamily: "monospace", color: "#3a3530" }}
                >
                  Berqayel · Akkar · Lebanon
                </p>
                <p
                  className="mt-1 text-xs"
                  style={{ fontFamily: "monospace", color: "#2a2520" }}
                >
                  34.5497° N, 36.2756° E
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Revenue ─────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="REVENUE MODEL" />

          <div className="my-12 text-center">
            <h2
              className="mb-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Six Revenue Streams
            </h2>
            <p className="text-sm" style={{ color: "#6a6060" }}>
              Designed for long-term financial sustainability beyond initial grant funding.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {REVENUE.map(({ n, title, desc }) => (
              <div
                key={n}
                className="flex items-start gap-4 rounded-lg p-6"
                style={{ border: "1px solid #2a2520", background: "#0a0906" }}
              >
                <span
                  className="shrink-0 text-xl font-bold"
                  style={{ fontFamily: "monospace", color: "#d4832a" }}
                >
                  {n}
                </span>
                <div>
                  <h3
                    className="mb-1 text-sm font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                  >
                    {title}
                  </h3>
                  <p className="text-xs" style={{ color: "#6a6060" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SDGs ────────────────────────────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "#0a0906" }}>
        <div className="mx-auto max-w-6xl">
          <AmberDivider label="UN SUSTAINABLE DEVELOPMENT GOALS" />

          <div className="my-12 text-center">
            <h2
              className="mb-4 text-3xl font-bold md:text-4xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Aligned with 7 SDGs
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {SDGS.map(({ n, label }) => (
              <div
                key={n}
                className="flex min-w-24 flex-col items-center gap-1 rounded-lg p-4 text-center"
                style={{ border: "1px solid #2a2520", background: "#0e0c0a" }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ fontFamily: "monospace", color: "#d4832a" }}
                >
                  SDG
                </span>
                <span
                  className="text-3xl font-bold"
                  style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                >
                  {n}
                </span>
                <span
                  className="text-xs leading-tight"
                  style={{ fontFamily: "monospace", color: "#6a6060" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <p
            className="mt-8 text-center text-xs"
            style={{ fontFamily: "monospace", color: "#3a3530" }}
          >
            Target donors: EED · GIZ · DW Akademie · UN agencies · IRC · Maharat · Rosa Luxemburg
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section id="support" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <AmberDivider />

          <div className="py-16 text-center">
            <p
              className="mb-6 text-xs uppercase tracking-widest"
              style={{ fontFamily: "monospace", color: "#d4832a" }}
            >
              ◆ Support the SpotCast Hub
            </p>
            <h2
              className="mb-6 text-4xl font-bold md:text-5xl"
              style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
            >
              Help Build Lebanon&apos;s
              <br />
              Most Ambitious
              <br />
              <span style={{ color: "#d4832a" }}>Community Hub.</span>
            </h2>
            <p
              className="mx-auto mb-10 max-w-xl text-sm leading-relaxed"
              style={{ color: "#6a6060" }}
            >
              We are seeking direct contributions, in-kind support, naming rights partnerships, and
              long-term lease agreements. Every partnership brings this vision closer to the
              communities of Akkar and beyond.
            </p>

            <div className="mx-auto mb-10 grid max-w-2xl gap-4 md:grid-cols-3">
              {[
                {
                  title: "Direct Funding",
                  desc: "Financial contributions to construction and fit-out",
                },
                {
                  title: "In-Kind Support",
                  desc: "Equipment, furniture, and technical resources",
                },
                {
                  title: "Naming Rights",
                  desc: "Studios, offices, floors — put your name on the map",
                },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="rounded-lg p-4 text-left"
                  style={{ border: "1px solid #2a2520", background: "#0a0906" }}
                >
                  <p className="mb-1 text-xs" style={{ color: "#d4832a" }}>
                    ◆
                  </p>
                  <h4
                    className="mb-1 text-sm font-bold"
                    style={{ fontFamily: "Georgia, serif", color: "#e8e0d0" }}
                  >
                    {title}
                  </h4>
                  <p className="text-xs" style={{ color: "#6a6060" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>

            <a
              href="mailto:info@spotcast.media"
              className="inline-block rounded px-8 py-4 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ fontFamily: "monospace", background: "#d4832a", color: "#0e0c0a" }}
            >
              Contact Us to Partner ◆
            </a>

            <p className="mt-4 text-xs" style={{ fontFamily: "monospace", color: "#3a3530" }}>
              info@spotcast.media · spotcast.media
            </p>
          </div>

          <AmberDivider />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        className="px-6 py-10"
        style={{ borderTop: "1px solid #1e1a16" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded"
              style={{ width: 24, height: 24, background: "#d4832a" }}
            >
              <span
                className="text-xs font-bold"
                style={{ fontFamily: "monospace", color: "#0e0c0a" }}
              >
                SC
              </span>
            </div>
            <span className="text-xs" style={{ fontFamily: "monospace", color: "#4a4540" }}>
              SpotCast Community &amp; Media Hub · سبوت كاست
            </span>
          </div>
          <p className="text-xs" style={{ fontFamily: "monospace", color: "#2e2a24" }}>
            Berqayel, Akkar, North Lebanon · Est. 2022
          </p>
          <div className="flex gap-4">
            {[
              ["mailto:info@spotcast.media", "info@spotcast.media"],
              ["https://spotcast.media", "spotcast.media"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-xs transition-colors"
                style={{ fontFamily: "monospace", color: "#4a4540" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#d4832a")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#4a4540")}
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
