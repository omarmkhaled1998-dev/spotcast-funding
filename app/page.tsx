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

const FAR  = "var(--font-noto-kufi), 'Noto Kufi Arabic', sans-serif";
const FAR_B = "var(--font-cairo), 'Cairo', 'Noto Kufi Arabic', sans-serif";

/* ─── Content (SHUMUL_CONTENT.ar) ────────────────────────── */
const PROGRAMS = [
  { num: "01", title: "الدعم الاجتماعي والإنساني",   body: "مبادرات لدعم الفئات الأكثر هشاشة في عكار: مساعدات موجَّهة، إحالات، ومرافقة اجتماعية." },
  { num: "02", title: "تمكين الشباب",                body: "تدريبات في القيادة، المهارات الحياتية، والإعلام المجتمعي، وفرص للانخراط في صنع القرار المحلي." },
  { num: "03", title: "تمكين النساء والحماية",       body: "برامج تعليمية واقتصادية، ومساحات آمنة للنقاش والحماية من العنف القائم على النوع الاجتماعي." },
  { num: "04", title: "المساحات الآمنة والحوار",     body: "جلسات حوارية بين الفئات والأجيال لمعالجة التوترات وبناء فهم مشترك." },
  { num: "05", title: "الثقافة والمجتمع",            body: "أنشطة ثقافية، سينما، قراءة، وأمسيات تربط الناس بهويتهم المحلية وبفنون منطقتهم." },
  { num: "06", title: "التطوع والمبادرات المحلية",   body: "شبكة من المتطوعين تنفّذ مبادرات صغيرة، سريعة، ونابعة من حاجة فعلية." },
];

const STATS = [
  { num: "+33", label: "عضوًا ومتطوعًا في الشبكة المجتمعية" },
  { num: "+40", label: "نشاطًا ومبادرة محلية منذ التأسيس" },
  { num: "12",  label: "شراكة مع مؤسسات محلية ودولية" },
  { num: "7",   label: "بلدات وقرى في عكار وشمال لبنان" },
];

const VALUES = [
  { title: "الكرامة",   body: "نضع كرامة الإنسان في صلب كل مبادرة، ونرفض أي شكل من أشكال الوصاية." },
  { title: "التضامن",   body: "نؤمن أن العمل المجتمعي يبدأ من الجار، ويتسع ليشمل الجميع." },
  { title: "المشاركة",  body: "لا نعمل من أجل الناس، بل معهم. القرار شراكة، والمسار جماعي." },
];

const PROJECTS = [
  { tag: "نادٍ",   title: "نادي شمول الثقافي",          body: "فضاء أسبوعي للسينما، القراءة، والنقاش الثقافي مع شباب المنطقة.",               bg: OLIVE_D  },
  { tag: "نادٍ",   title: "نادي شمول الاجتماعي",        body: "مساحة للقاء، تبادل المهارات، والعمل الجماعي على قضايا محلية.",                bg: TERRA    },
  { tag: "حوار",   title: "جلسات دعم وحوار مجتمعي",    body: "حلقات إصغاء وحوار للنساء والشباب حول قضايا الحياة اليومية.",                  bg: OLIVE_L  },
  { tag: "شباب",   title: "مبادرات شبابية وتطوعية",     body: "دعم مبادرات يقودها الشباب أنفسهم في قراهم وأحيائهم.",                        bg: "#5E7349" },
  { tag: "حملة",   title: "حملات توعية مجتمعية",        body: "حملات حول الصحة، الحقوق، والمشاركة المدنية في عكار وشمال لبنان.",             bg: TERRA_D  },
];

const BULLETS = ["دعم اجتماعي وإنساني", "أنشطة ثقافية وحوارية", "حملات توعية ميدانية", "إنتاج محتوى مجتمعي"];

/* ─── Helpers ─────────────────────────────────────────────── */
function Eyebrow({ label, onDark }: { label: string; onDark?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: FAR_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: onDark ? "#D88A6E" : OLIVE }}>
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
        <h3 style={{ fontFamily: FAR, fontSize: 22, fontWeight: 700, color: INK, marginBottom: 8 }}>وصلت رسالتك</h3>
        <p style={{ fontFamily: FAR_B, fontSize: 15, color: INK_M, marginBottom: 24 }}>سنعود إليك قريبًا. شكرًا لتواصلك مع شمول.</p>
        <button onClick={() => { setStatus("idle"); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
          style={{ fontFamily: FAR_B, fontSize: 14, fontWeight: 600, color: OLIVE, background: "transparent", border: `1px solid ${OLIVE}`, borderRadius: 2, padding: "10px 24px", cursor: "pointer" }}>
          إرسال رسالة أخرى
        </button>
      </div>
    );
  }

  const inputStyle = { width: "100%", padding: "12px 14px", border: `1px solid ${RULE}`, borderRadius: 3, background: SURFACE, color: INK, fontFamily: FAR_B, fontSize: 14, outline: "none", boxSizing: "border-box" as const };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontFamily: FAR_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>الاسم *</label>
          <input value={form.name} onChange={set("name")} required placeholder="اسمك الكامل" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: FAR_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>البريد الإلكتروني *</label>
          <input type="email" value={form.email} onChange={set("email")} required placeholder="name@example.com" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={{ display: "block", fontFamily: FAR_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>رقم الهاتف</label>
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+961 …" style={inputStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: FAR_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>الموضوع</label>
          <input value={form.subject} onChange={set("subject")} placeholder="تطوع، شراكة، استفسار…" style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontFamily: FAR_B, fontSize: 12, fontWeight: 600, color: INK_B, marginBottom: 6 }}>الرسالة *</label>
        <textarea value={form.message} onChange={set("message")} required placeholder="اكتب لنا…" rows={5}
          style={{ ...inputStyle, resize: "vertical" as const, minHeight: 120 }} />
      </div>
      <button type="submit" disabled={status === "sending"}
        style={{ alignSelf: "flex-start", fontFamily: FAR_B, fontSize: 15, fontWeight: 700, color: ON_DARK, background: status === "sending" ? OLIVE_L : OLIVE, border: "none", borderRadius: 2, padding: "14px 32px", cursor: "pointer" }}>
        {status === "sending" ? "جارٍ الإرسال…" : "أرسل الرسالة"}
      </button>
    </form>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function ShumulHome() {
  return (
    <div style={{ background: BG, color: INK, fontFamily: FAR_B }} dir="rtl">

      {/* ── Top nav ── */}
      <ShumulTopNav />

      {/* ── Sticky page header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(248,243,232,0.96)", backdropFilter: "saturate(140%) blur(12px)", WebkitBackdropFilter: "saturate(140%) blur(12px)", borderBottom: `1px solid ${RULE}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ShumulLogo size={36} variant="light" />
            <div>
              <p style={{ fontFamily: FAR, fontSize: 18, fontWeight: 800, color: OLIVE_D, margin: 0, lineHeight: 1.2 }}>شمول</p>
              <p style={{ fontFamily: FAR_B, fontSize: 11, color: INK_M, margin: 0 }}>مؤسسة اجتماعية وإنسانية · عكار</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {[["#about", "من نحن"], ["#programs", "برامجنا"], ["#contact", "تواصل"]].map(([href, label]) => (
              <a key={href} href={href} style={{ fontFamily: FAR_B, fontSize: 13, fontWeight: 500, color: INK_M, textDecoration: "none" }}>{label}</a>
            ))}
            <a href="#contact" style={{ fontFamily: FAR_B, fontSize: 13, fontWeight: 700, color: ON_DARK, background: OLIVE, borderRadius: 2, padding: "8px 20px", textDecoration: "none" }}>ادعمنا</a>
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
        <div style={{ position: "absolute", left: "-0.05em", bottom: "-0.12em", fontFamily: FAR, fontWeight: 900, fontSize: "clamp(200px,32vw,420px)", color: "rgba(248,243,232,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>شمول</div>

        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <Eyebrow label="مؤسسة اجتماعية وإنسانية · عكار، شمال لبنان" onDark />
          </div>
          <h1 style={{ fontFamily: FAR, fontWeight: 900, fontSize: "clamp(44px,7vw,92px)", color: ON_DARK, lineHeight: 1.18, letterSpacing: 0, margin: "0 0 24px" }}>
            مساحة للناس،<br />للدعم،<br />وللحياة الكريمة.
          </h1>
          <p style={{ fontFamily: FAR_B, fontSize: "clamp(15px,1.4vw,18px)", color: "rgba(248,243,232,0.82)", lineHeight: 1.9, maxWidth: 560, marginBottom: 40 }}>
            مؤسسة اجتماعية وإنسانية تعمل في عكار وشمال لبنان لدعم الفئات المهمّشة، وتمكين الشباب والنساء، وخلق مساحات آمنة للحوار والعمل المجتمعي.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12, marginBottom: 56 }}>
            <a href="#about" style={{ fontFamily: FAR_B, fontSize: 15, fontWeight: 700, color: OLIVE_D, background: ON_DARK, borderRadius: 2, padding: "14px 28px", textDecoration: "none" }}>تعرّفوا علينا</a>
            <a href="#volunteer" style={{ fontFamily: FAR_B, fontSize: 15, fontWeight: 600, color: ON_DARK, background: "transparent", border: "1px solid rgba(248,243,232,0.4)", borderRadius: 2, padding: "14px 28px", textDecoration: "none" }}>تطوّع معنا</a>
          </div>
          {/* Meta strip */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 24, paddingTop: 24, borderTop: `1px solid ${RULE_D}` }}>
            {[["تأسست", "2024"], ["المنطقة", "عكار"], ["الشبكة", "+33 عضوًا"], ["المبادرات", "+40 نشاط"]].map(([l, v]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: FAR_B, fontSize: 11, color: "rgba(248,243,232,0.5)", letterSpacing: "0.06em" }}>{l}</span>
                <span style={{ fontFamily: FAR, fontSize: 13, fontWeight: 700, color: "rgba(248,243,232,0.9)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <Section bg={SURFACE} tight>
        <div id="about" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,96px)", alignItems: "start" }}>
          <div>
            <div style={{ marginBottom: 20 }}><Eyebrow label="من نحن" /></div>
            <h2 style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(30px,4vw,52px)", color: INK, lineHeight: 1.25, letterSpacing: 0, margin: "0 0 24px" }}>
              نبدأ من الإصغاء،<br />وننتهي بالفعل.
            </h2>
            <p style={{ fontFamily: FAR_B, fontSize: 16, color: INK_B, lineHeight: 1.9, marginBottom: 0 }}>
              مؤسسة شمول الاجتماعية مؤسسة اجتماعية وإنسانية نشأت من تجربة عمل مجتمعي طويلة في عكار، تركّز على الدعم الاجتماعي، المبادرات الإنسانية، تمكين الشباب والنساء، وتنظيم الأنشطة الثقافية والاجتماعية التي تعزز التضامن المحلي.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 16, paddingTop: 8 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background: BG_ALT, borderRadius: 4, padding: "24px 28px", borderInlineStart: `3px solid ${TERRA}` }}>
                <h3 style={{ fontFamily: FAR, fontSize: 17, fontWeight: 800, color: INK, margin: "0 0 8px" }}>{v.title}</h3>
                <p style={{ fontFamily: FAR_B, fontSize: 14, color: INK_M, lineHeight: 1.85, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Programs ── */}
      <Section bg={BG} id="programs">
        <div id="programs" style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}><Eyebrow label="برامجنا" /></div>
          <h2 style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(32px,4vw,56px)", color: INK, margin: "0 0 16px" }}>ماذا نفعل؟</h2>
          <p style={{ fontFamily: FAR_B, fontSize: 16, color: INK_M, lineHeight: 1.85, maxWidth: 560, margin: 0 }}>
            ستة محاور تعمل بشكل متشابك لتغطية الحاجات الاجتماعية والثقافية والإنسانية في المنطقة.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(16px,2vw,24px)" }}>
          {PROGRAMS.map(p => (
            <div key={p.num} style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 4, padding: "clamp(20px,2.4vw,28px)", transition: "transform 220ms, box-shadow 220ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(31,26,20,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
              <div style={{ fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: TERRA, letterSpacing: "0.04em", marginBottom: 12 }}>{p.num}</div>
              <h3 style={{ fontFamily: FAR, fontSize: 17, fontWeight: 800, color: INK, margin: "0 0 10px", lineHeight: 1.35 }}>{p.title}</h3>
              <p style={{ fontFamily: FAR_B, fontSize: 14, color: INK_M, lineHeight: 1.85, margin: 0 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Impact stats ── */}
      <section style={{ background: OLIVE_D, padding: "96px clamp(20px,4vw,56px)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.4, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: 16 }}><Eyebrow label="أثرنا يبدأ من الناس" onDark /></div>
          <h2 style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(32px,4vw,56px)", color: ON_DARK, margin: "0 0 12px" }}>أرقام صغيرة. حضور حقيقي.</h2>
          <p style={{ fontFamily: FAR_B, fontSize: 16, color: "rgba(248,243,232,0.72)", lineHeight: 1.9, maxWidth: 560, marginBottom: 64 }}>
            لسنا منظمة كبيرة، ولا نريد أن نكون. نحن شبكة محلية تعمل بثبات في منطقة قلّما تصلها الأضواء.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(24px,3vw,48px)" }}>
            {STATS.map(s => (
              <div key={s.num}>
                <span style={{ fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: "clamp(52px,6vw,84px)", color: TERRA, lineHeight: 0.95, letterSpacing: "-0.02em", display: "block" }}>{s.num}</span>
                <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.72)", lineHeight: 1.7, marginTop: 12 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <Section bg={BG_ALT}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ marginBottom: 16 }}><Eyebrow label="مشاريع ومبادرات" /></div>
          <h2 style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(32px,4vw,56px)", color: INK, margin: 0 }}>من الفكرة إلى الأرض.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(16px,2vw,24px)" }}>
          {PROJECTS.map(p => (
            <div key={p.title} style={{ background: p.bg, borderRadius: 4, padding: "clamp(24px,2.4vw,32px)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.4, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: FAR_B, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(248,243,232,0.55)", marginBottom: 12, textTransform: "uppercase" as const }}>{p.tag}</div>
                <h3 style={{ fontFamily: FAR, fontSize: 18, fontWeight: 800, color: ON_DARK, margin: "0 0 10px", lineHeight: 1.4 }}>{p.title}</h3>
                <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.78)", lineHeight: 1.85, margin: 0 }}>{p.body}</p>
              </div>
            </div>
          ))}
          {/* CTA card */}
          <div style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 4, padding: "clamp(24px,2.4vw,32px)", display: "flex", flexDirection: "column" as const, justifyContent: "center" }}>
            <h3 style={{ fontFamily: FAR, fontSize: 18, fontWeight: 800, color: INK, margin: "0 0 10px" }}>هل لديك فكرة مبادرة؟</h3>
            <p style={{ fontFamily: FAR_B, fontSize: 14, color: INK_M, lineHeight: 1.85, margin: "0 0 20px" }}>نحن ندعم المبادرات المحلية الصغيرة. تحدّث إلينا.</p>
            <a href="#contact" style={{ fontFamily: FAR_B, fontSize: 14, fontWeight: 700, color: ON_DARK, background: OLIVE, borderRadius: 2, padding: "12px 24px", textDecoration: "none", display: "inline-block", textAlign: "center" as const }}>تواصل معنا</a>
          </div>
        </div>
      </Section>

      {/* ── Story pull quote ── */}
      <section style={{ background: BG_DEEP, padding: "80px clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}><Eyebrow label="منهجنا" /></div>
          <blockquote style={{ borderInlineStart: `3px solid ${TERRA}`, paddingInlineStart: "clamp(24px,3vw,40px)", margin: 0 }}>
            <p style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(22px,3vw,36px)", color: INK, lineHeight: 1.45, letterSpacing: 0, margin: "0 0 16px" }}>
              "البرنامج الجيد لا يُكتب في مكتب. يُكتب على درج بيت، وفي مقهى قرية، وعلى هامش ورشة شغل."
            </p>
            <cite style={{ fontFamily: FAR_B, fontSize: 14, color: INK_M, fontStyle: "normal" as const }}>— من جلسات شمول</cite>
          </blockquote>
        </div>
      </section>

      {/* ── Volunteer ── */}
      <Section id="volunteer" bg={SURFACE} tight>
        <div id="volunteer" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(40px,6vw,96px)", alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 16 }}><Eyebrow label="كن جزءًا من شمول" /></div>
            <h2 style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(28px,3.5vw,48px)", color: INK, margin: "0 0 20px", lineHeight: 1.25 }}>
              نحن نبني هذه المساحة معًا.
            </h2>
            <p style={{ fontFamily: FAR_B, fontSize: 16, color: INK_B, lineHeight: 1.9, marginBottom: 32 }}>
              نبحث دائمًا عن شباب وشابات يؤمنون بالعمل المجتمعي، ويريدون المساهمة في بناء بيئة أكثر تضامنًا وعدالة. لا نحتاج خبرات، نحتاج التزامًا.
            </p>
            <a href="#contact" style={{ fontFamily: FAR_B, fontSize: 15, fontWeight: 700, color: ON_DARK, background: TERRA, borderRadius: 2, padding: "14px 32px", textDecoration: "none", display: "inline-block" }}>تطوّع معنا</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {BULLETS.map(b => (
              <div key={b} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: BG_ALT, borderRadius: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: TERRA, flexShrink: 0 }} />
                <span style={{ fontFamily: FAR_B, fontSize: 15, color: INK_B, fontWeight: 500 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section bg={BG} tight>
        <div id="contact" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "clamp(40px,6vw,96px)", alignItems: "start" }}>
          <div style={{ paddingTop: 8 }}>
            <div style={{ marginBottom: 16 }}><Eyebrow label="تواصل معنا" /></div>
            <h2 style={{ fontFamily: FAR, fontWeight: 800, fontSize: "clamp(28px,3.5vw,48px)", color: INK, margin: "0 0 16px" }}>تحدّث إلينا.</h2>
            <p style={{ fontFamily: FAR_B, fontSize: 16, color: INK_B, lineHeight: 1.9, marginBottom: 40 }}>
              إذا كنت تريد التطوع، الشراكة، أو طرح فكرة مبادرة — اكتب لنا. نقرأ كل رسالة.
            </p>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {[["المنطقة", "عكار، شمال لبنان"], ["أيام العمل", "الإثنين – الجمعة"], ["البريد", "info@shumul.org"]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontFamily: FAR_B, fontSize: 12, fontWeight: 600, color: INK_M, letterSpacing: "0.06em", flexShrink: 0, paddingTop: 2 }}>{l}</span>
                  <span style={{ fontFamily: FAR_B, fontSize: 15, color: INK_B }}>{v}</span>
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
          <p style={{ fontFamily: FAR, fontWeight: 800, fontSize: 13, color: OLIVE, letterSpacing: "0.1em", marginBottom: 32, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 1.5, background: "currentColor", display: "inline-block" }} />
            مبادراتنا
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            <Link href="/initiatives/shumul" style={{ background: OLIVE_D, borderRadius: 6, padding: "clamp(28px,3vw,44px)", textDecoration: "none", display: "block", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.4, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontFamily: FAR_B, fontSize: 11, letterSpacing: "0.1em", color: "rgba(248,243,232,0.5)", marginBottom: 10 }}>مبادرة</div>
                <h3 style={{ fontFamily: FAR, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 800, color: ON_DARK, margin: "0 0 12px" }}>مبادرة شمول للتطوير المؤسسي</h3>
                <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.75)", lineHeight: 1.85, margin: "0 0 24px" }}>برنامج مجاني يربط الطلاب بالمؤسسات الناشئة في عكار وشمال لبنان.</p>
                <span style={{ fontFamily: FAR_B, fontSize: 14, fontWeight: 700, color: TERRA + "cc" }}>← استعرض البرنامج</span>
              </div>
            </Link>
            <Link href="/hub" style={{ background: "#0e2334", borderRadius: 6, padding: "clamp(28px,3vw,44px)", textDecoration: "none", display: "block" }}>
              <div style={{ fontFamily: FAR_B, fontSize: 11, letterSpacing: "0.1em", color: "rgba(248,243,232,0.5)", marginBottom: 10 }}>مشروع</div>
              <h3 style={{ fontFamily: FAR, fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 800, color: ON_DARK, margin: "0 0 12px" }}>شمول هاب — مركز المجتمع والإعلام</h3>
              <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.75)", lineHeight: 1.85, margin: "0 0 24px" }}>مركز مجتمعي وإعلامي متكامل في برقايل — 6 طوابق، استوديوهات، مساحات مجتمعية.</p>
              <span style={{ fontFamily: FAR_B, fontSize: 14, fontWeight: 700, color: "#dd7c99cc" }}>← تعرّف على المشروع</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: OLIVE_D, color: ON_DARK, padding: "56px clamp(20px,4vw,56px) 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "clamp(32px,4vw,64px)", paddingBottom: 40, borderBottom: `1px solid ${RULE_D}` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <ShumulLogo size={36} variant="white" />
                <span style={{ fontFamily: FAR, fontSize: 22, fontWeight: 900, color: ON_DARK }}>شمول</span>
              </div>
              <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.65)", lineHeight: 1.85, maxWidth: 280, margin: "0 0 16px" }}>مؤسسة اجتماعية وإنسانية تعمل في عكار وشمال لبنان.</p>
              <p style={{ fontFamily: FAR_B, fontSize: 12, color: "rgba(248,243,232,0.4)", margin: 0 }}>منصة شقيقة لـ SpotCast</p>
            </div>
            <div>
              <p style={{ fontFamily: FAR_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(248,243,232,0.4)", marginBottom: 16 }}>روابط سريعة</p>
              {[["#about", "من نحن"], ["#programs", "برامجنا"], ["#contact", "تواصل"], ["/initiatives/shumul", "مبادرة شمول"], ["/hub", "شمول هاب"]].map(([href, label]) => (
                <div key={href} style={{ marginBottom: 10 }}>
                  <a href={href} style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.65)", textDecoration: "none" }}>{label}</a>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: FAR_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "rgba(248,243,232,0.4)", marginBottom: 16 }}>تواصل</p>
              <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.65)", marginBottom: 8 }}>عكار، شمال لبنان</p>
              <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.65)", marginBottom: 8 }}>info@shumul.org</p>
              <p style={{ fontFamily: FAR_B, fontSize: 14, color: "rgba(248,243,232,0.65)" }}>الإثنين – الجمعة</p>
            </div>
          </div>
          <div style={{ paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <p style={{ fontFamily: FAR_B, fontSize: 13, color: "rgba(248,243,232,0.4)", margin: 0 }}>© 2026 مؤسسة شمول الاجتماعية. جميع الحقوق محفوظة.</p>
            <a href="#" style={{ fontFamily: FAR_B, fontSize: 13, color: "rgba(248,243,232,0.4)", textDecoration: "none" }}>↑ إلى الأعلى</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
