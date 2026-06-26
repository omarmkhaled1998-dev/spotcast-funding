"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShumulLogo } from "@/components/hub/ShumulLogo";

const OLIVE   = "#4A5C39";
const OLIVE_D = "#3A4A2C";
const INK_MUTE = "#6B6258";
const RULE = "rgba(31,26,20,0.12)";
const FONT_AR = "var(--font-noto-kufi), 'Noto Kufi Arabic', 'Cairo', sans-serif";

const TABS = [
  { href: "/",                  label: "الصفحة الرئيسية" },
  { href: "/initiatives/shumul", label: "صفحة المبادرة"   },
  { href: "/hub",               label: "شمول هاب"         },
];

export function ShumulTopNav() {
  const pathname = usePathname();

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      dir="rtl"
      style={{
        background: "rgba(248,243,232,0.97)",
        backdropFilter: "saturate(140%) blur(12px)",
        WebkitBackdropFilter: "saturate(140%) blur(12px)",
        borderBottom: `1px solid ${RULE}`,
        zIndex: 55,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(16px,4vw,48px)", display: "flex", alignItems: "center", gap: 10, height: 44 }}>
        <ShumulLogo size={26} variant="light" />
        <div style={{ width: 1, height: 20, background: RULE, flexShrink: 0 }} />
        {TABS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              padding: "0 14px",
              fontFamily: FONT_AR,
              fontSize: 13,
              fontWeight: active(href) ? 700 : 500,
              color: active(href) ? OLIVE_D : INK_MUTE,
              textDecoration: "none",
              borderBottom: active(href) ? `2px solid ${OLIVE}` : "2px solid transparent",
              transition: "color 150ms, border-color 150ms",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
