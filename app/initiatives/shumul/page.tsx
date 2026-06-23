"use client";

import { useState } from "react";
import Link from "next/link";
import { ShumulLogo } from "@/components/hub/ShumulLogo";
import { InjazLogo } from "@/components/hub/InjazLogo";
import { SpotCastLogo } from "@/components/hub/SpotCastLogo";

/* ─── Design tokens ─────────────────────────────────────────── */
const OLIVE    = "#4A5C39";
const OLIVE_D  = "#3A4A2C";
const OLIVE_L  = "#7A8F5E";
const TERRA    = "#C76B4A";
const TERRA_D  = "#B05839";
const BG       = "#F8F3E8";
const BG_ALT   = "#F1E9DA";
const SURFACE  = "#FBF7EE";
const INK      = "#1F1A14";
const INK_BODY = "#3D362F";
const INK_MUTE = "#6B6258";
const RULE     = "rgba(31,26,20,0.12)";
const RULE_S   = "rgba(31,26,20,0.06)";
const RULE_D   = "rgba(248,243,232,0.18)";
const ON_DARK  = "#FBF7EE";

const FONT_AR_D = "var(--font-noto-kufi), 'Noto Kufi Arabic', 'Cairo', sans-serif";
const FONT_AR_B = "var(--font-cairo), 'Cairo', 'Noto Kufi Arabic', sans-serif";

/* ─── Content ───────────────────────────────────────────────── */
const WINS = [
  { mark: "◆", title: "الطلاب", desc: "تدريب ميداني حقيقي وشهادة معتمدة ومهارات جاهزة لسوق العمل خلال 6 أشهر" },
  { mark: "◆", title: "المؤسسات", desc: "خدمات مالية وقانونية ورقمية — مجانية بالكامل للمؤسسات المستفيدة" },
  { mark: "◆", title: "SpotCast", desc: "أثر مجتمعي موثّق ونتائج قابلة للقياس وسجل مؤسسي حقيقي" },
  { mark: "◆", title: "INJAZ Lebanon", desc: "توسيع الانتشار في عكار وفرص حقيقية للطلاب وتعاون في قياس الأثر" },
];

const PILLARS = [
  {
    n: "01", tag: "مالية · أعمال",
    title: "الأنظمة المالية والاستدامة",
    items: ["إعداد أنظمة محاسبية وإطار التخطيط المالي", "تنويع الإيرادات ونماذج الاستدامة المؤسسية", "إرشادات تبني منظومة الدفع الرقمي", "تصميم سياسات المخزون واستراتيجية التسعير"],
  },
  {
    n: "02", tag: "قانون · إدارة",
    title: "الامتثال القانوني وكتابة المقترحات",
    items: ["دعم التسجيل القانوني وإعداد ملفات المناقصات", "إرشادات الامتثال الضريبي والتوثيق", "كتابة مقترحات المنح للمؤسسات المستفيدة", "نماذج العقود وإطار الامتثال المؤسسي"],
  },
  {
    n: "03", tag: "إعلام · تقنية",
    title: "الحضور الرقمي والاستقلالية",
    items: ["إنشاء منصات التواصل الاجتماعي وإدارتها واستراتيجية المحتوى", "تطوير الموقع الإلكتروني وأساسيات تحسين محركات البحث", "خطة المحتوى الشهرية والجدولة", "تدريب الفريق على الأدوات الرقمية — بهدف الاستقلالية التامة"],
  },
];

const PHASES = [
  {
    tag: "المرحلة 0", name: "التأسيس", period: "أغسطس – سبتمبر 2026",
    items: ["توقيع اتفاقية الشراكة الرسمية مع INJAZ Lebanon", "تحديد والتحقق من 3–5 مؤسسات تجريبية في عكار", "بناء معايير اختيار الطلاب وحزمة التدريب التمهيدي", "تصميم أداة التشخيص المؤسسي (15–20 سؤال)"],
  },
  {
    tag: "المرحلة 1", name: "التجريب", period: "أكتوبر – ديسمبر 2026",
    items: ["استقطاب 6–9 متدربين من جامعات شمال لبنان", "توزيع 2–3 متدربين لكل مؤسسة لمدة شهرين", "تنفيذ خطط تطوير مخصصة لكل مؤسسة", "توثيق دقيق لجميع المخرجات ومؤشرات الأثر"],
  },
  {
    tag: "المرحلة 2", name: "التوسع", period: "يناير – مارس 2027",
    items: ["إعداد تقرير الأثر وقصص النجاح الموثقة", "التوسع لأكثر من 10 مؤسسات في شمال لبنان"],
  },
];

const SECTORS = ["الزراعة والصناعات الغذائية", "الحرف التقليدية والمهن", "التجارة المحلية", "الخدمات الرقمية والتقنية", "التعاونيات الزراعية", "تعاونيات المرأة", "جمعيات الشباب", "المبادرات البلدية"];

/* ─── Registration forms ────────────────────────────────────── */
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
      <FInput label="اسم المؤسسة *" value={data.orgName} onChange={set("orgName")} required placeholder="أدخل اسم مؤسستك" />
      <FSelect label="نوع المؤسسة *" value={data.orgType} onChange={set("orgType")} required
        options={["جمعية شبابية", "مشروع صغير أو متناهي الصغر", "تعاونية", "مبادرة بلدية", "منظمة غير حكومية", "أخرى"]} />
      <FSelect label="المنطقة *" value={data.location} onChange={set("location")} required
        options={["عكار", "شمال لبنان (مناطق أخرى)", "كلاهما"]} />
      <FSelect label="حجم الفريق" value={data.teamSize} onChange={set("teamSize")}
        options={["1–5 أشخاص", "6–15 شخص", "16–50 شخص", "أكثر من 50"]} />
    </div>
  );
  const s1 = (
    <div className="space-y-4">
      <FSelect label="أبرز تحدياتكم *" value={data.challenges} onChange={set("challenges")} required
        options={["الأنظمة المالية والاستدامة", "الامتثال القانوني وكتابة المقترحات", "الحضور الرقمي والتواصل", "المحاور الثلاثة مجتمعة"]} />
      <FTextarea label="وصف مختصر لمؤسستكم *" value={data.description} onChange={set("description")} rows={3} required placeholder="ماذا تفعل مؤسستك؟ وما الذي تأمل تحقيقه بدعم مبادرة شمول؟" />
    </div>
  );
  const s2 = (
    <div className="space-y-4">
      <FInput label="اسم جهة الاتصال *" value={data.contactName} onChange={set("contactName")} required />
      <FInput label="البريد الإلكتروني *" type="email" value={data.email} onChange={set("email")} required />
      <FInput label="رقم الهاتف" type="tel" value={data.phone} onChange={set("phone")} placeholder="+961 xx xxx xxx" />
    </div>
  );
  const steps = [s0, s1, s2];
  const labels = ["بيانات المؤسسة", "تقييم الاحتياجات", "معلومات التواصل"];

  return (
    <form onSubmit={submit} dir="rtl" style={{ fontFamily: FONT_AR_B }}>
      <StepIndicator steps={labels} current={step} />
      <div className="mt-5">{steps[step]}</div>
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button type="button" onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 text-sm font-semibold"
            style={{ border: `1px solid ${RULE}`, color: INK_MUTE, borderRadius: 2, fontFamily: FONT_AR_B }}>
            → رجوع
          </button>
        )}
        {step < steps.length - 1
          ? <button type="button" onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 text-sm font-bold"
              style={{ background: OLIVE, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>
              ← التالي
            </button>
          : <button type="submit" disabled={loading}
              className="flex-1 py-3 text-sm font-bold"
              style={{ background: loading ? OLIVE_L : OLIVE, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>
              {loading ? "جارٍ الإرسال…" : "إرسال الطلب"}
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
    <form onSubmit={submit} className="space-y-4" dir="rtl" style={{ fontFamily: FONT_AR_B }}>
      <FInput label="الاسم الكامل *" value={data.fullName} onChange={set("fullName")} required />
      <div className="grid grid-cols-2 gap-3">
        <FSelect label="الجامعة *" value={data.university} onChange={set("university")} required
          options={["الجامعة اللبنانية الدولية (LIU)", "الجامعة الأمريكية للتكنولوجيا (AUT)", "جامعة البلمند", "الجامعة اللبنانية", "أخرى"]} />
        <FSelect label="الكلية / التخصص *" value={data.faculty} onChange={set("faculty")} required
          options={["إدارة الأعمال", "القانون", "الإعلام والاتصالات", "تقنية المعلومات", "الهندسة", "أخرى"]} />
      </div>
      <FSelect label="السنة الدراسية *" value={data.year} onChange={set("year")} required
        options={["السنة الأولى", "السنة الثانية", "السنة الثالثة", "السنة الرابعة", "الدراسات العليا", "خريج حديث"]} />
      <div className="grid grid-cols-2 gap-3">
        <FInput label="البريد الإلكتروني *" type="email" value={data.email} onChange={set("email")} required />
        <FInput label="رقم الهاتف" type="tel" value={data.phone} onChange={set("phone")} placeholder="+961" />
      </div>
      <FTextarea label="لماذا تريد الانضمام؟ *" value={data.motivation} onChange={set("motivation")} rows={3} required
        placeholder="حدثنا عن اهتمامك بالمبادرة وما الذي تأمل المساهمة به…" />
      <button type="submit" disabled={loading} className="w-full py-3 text-sm font-bold"
        style={{ background: loading ? OLIVE_L : OLIVE, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>
        {loading ? "جارٍ الإرسال…" : "تقديم الطلب"}
      </button>
    </form>
  );
}

/* ─── Form primitives ─────────────────────────────────────────── */
function FInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: INK_BODY, fontFamily: FONT_AR_B }}>{label}</label>
      <input {...props} className="w-full text-sm outline-none"
        style={{ padding: "12px 14px", border: `1px solid ${RULE}`, borderRadius: 3, background: SURFACE, color: INK, fontFamily: FONT_AR_B }} />
    </div>
  );
}
function FSelect({ label, options, ...props }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: INK_BODY, fontFamily: FONT_AR_B }}>{label}</label>
      <select {...props} className="w-full text-sm outline-none"
        style={{ padding: "12px 14px", border: `1px solid ${RULE}`, borderRadius: 3, background: SURFACE, color: props.value ? INK : INK_MUTE, fontFamily: FONT_AR_B }}>
        <option value="">اختر...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function FTextarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: INK_BODY, fontFamily: FONT_AR_B }}>{label}</label>
      <textarea {...props} className="w-full text-sm outline-none resize-none"
        style={{ padding: "12px 14px", border: `1px solid ${RULE}`, borderRadius: 3, background: SURFACE, color: INK, fontFamily: FONT_AR_B }} />
    </div>
  );
}
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1 flex-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold flex-shrink-0"
              style={{ background: i <= current ? OLIVE : BG_ALT, color: i <= current ? ON_DARK : INK_MUTE, borderRadius: 2 }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className="text-xs hidden sm:block" style={{ color: i === current ? OLIVE : INK_MUTE, fontWeight: i === current ? 600 : 400, fontFamily: FONT_AR_B }}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className="h-px flex-1 mx-1" style={{ background: i < current ? OLIVE : RULE }} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(31,26,20,0.6)" }}>
      <div className="w-full max-w-lg overflow-hidden shadow-2xl" style={{ background: SURFACE, maxHeight: "92vh", overflowY: "auto", borderRadius: 6 }}>
        <div className="px-6 pt-6 pb-4" style={{ background: OLIVE_D }}>
          <div className="flex justify-between items-start" dir="rtl">
            <div>
              <h3 className="font-bold text-lg" style={{ color: ON_DARK, fontFamily: FONT_AR_D }}>{title}</h3>
              {subtitle && <p className="text-sm mt-1" style={{ color: "rgba(248,243,232,0.75)", fontFamily: FONT_AR_B }}>{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-xl leading-none mr-4" style={{ color: "rgba(248,243,232,0.6)" }}>✕</button>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function SuccessView({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="text-center py-8" dir="rtl">
      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center text-2xl"
        style={{ background: BG_ALT, borderRadius: 4, color: OLIVE, fontSize: 28 }}>✓</div>
      <h3 className="font-bold text-lg mb-2" style={{ color: INK, fontFamily: FONT_AR_D }}>تم الإرسال بنجاح</h3>
      <p className="text-sm mb-6" style={{ color: INK_MUTE, fontFamily: FONT_AR_B }}>{message}</p>
      <button onClick={onClose} className="px-8 py-3 text-sm font-bold"
        style={{ background: OLIVE, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>إغلاق</button>
    </div>
  );
}

/* ─── Section eyebrow ─────────────────────────────────────────── */
function Eyebrow({ label, onDark }: { label: string; onDark?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, fontFamily: FONT_AR_B, fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: onDark ? "#C9A96E" : OLIVE }}>
      <span style={{ width: 28, height: 1, background: "currentColor", display: "inline-block", flexShrink: 0 }} />
      {label}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function ShumulInitiativeAR() {
  const [modal, setModal] = useState<"institution" | "student" | null>(null);
  const [done, setDone] = useState<"institution" | "student" | null>(null);

  return (
    <div className="min-h-screen" style={{ background: BG, color: INK }} dir="rtl">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40"
        style={{ background: "rgba(248,243,232,0.95)", backdropFilter: "saturate(140%) blur(12px)", borderBottom: `1px solid ${RULE}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <ShumulLogo size={36} variant="light" />
            <div>
              <p className="font-bold leading-tight" style={{ color: OLIVE_D, fontFamily: FONT_AR_D, fontSize: 16 }}>مبادرة شمول</p>
              <p style={{ color: INK_MUTE, fontFamily: FONT_AR_B, fontSize: 11 }}>للتطوير المؤسسي · عكار والشمال</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/initiatives/shumul/en"
              className="text-xs px-3 py-1.5 transition-colors"
              style={{ color: INK_MUTE, border: `1px solid ${RULE}`, borderRadius: 999, fontFamily: "var(--font-barlow), 'Barlow', sans-serif", letterSpacing: "0.06em" }}>
              EN
            </Link>
            <button onClick={() => setModal("institution")}
              className="px-5 py-2 text-sm font-semibold"
              style={{ background: OLIVE, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>
              سجّل الآن
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "76vh",
        background: "radial-gradient(ellipse at 30% 20%, rgba(122,143,94,0.45), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(58,74,44,0.55), transparent 60%), linear-gradient(135deg, #5E7349 0%, #3A4A2C 100%)"
      }} className="flex items-center px-6 py-20">
        {/* grain overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.5, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
        {/* watermark letter */}
        <div style={{ position: "absolute", left: "-0.1em", bottom: "-0.15em", fontFamily: FONT_AR_D, fontWeight: 900, fontSize: "clamp(180px,28vw,360px)", color: "rgba(248,243,232,0.04)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>شمول</div>
        <div className="mx-auto w-full max-w-5xl relative z-10">
          <div className="mb-6">
            <Eyebrow label="ملخص البرنامج · شراكة INJAZ Lebanon" onDark />
          </div>
          <h1 className="font-extrabold leading-tight mb-3"
            style={{ fontFamily: FONT_AR_D, fontSize: "clamp(40px,7vw,80px)", color: ON_DARK, letterSpacing: 0, lineHeight: 1.15 }}>
            مبادرة شمول
          </h1>
          <p style={{ fontFamily: "var(--font-barlow), 'Barlow', sans-serif", fontSize: "clamp(13px,1.8vw,17px)", color: "rgba(248,243,232,0.65)", marginBottom: 16 }}>
            Shumul Institutional Development Initiative
          </p>
          <p className="max-w-xl leading-relaxed mb-8"
            style={{ fontFamily: FONT_AR_B, fontSize: 15, color: "rgba(248,243,232,0.85)", lineHeight: 1.85 }}>
            برنامج تطوير مؤسسي مجاني يربط طلاب الجامعات بالمؤسسات الناشئة والصغيرة
            في عكار وشمال لبنان — لا يُكلّف المستفيدين أي شيء.
          </p>
          <div className="flex flex-wrap gap-3 mb-10">
            <button onClick={() => setModal("institution")}
              className="px-7 py-3 text-sm font-bold"
              style={{ background: ON_DARK, color: OLIVE_D, borderRadius: 2, fontFamily: FONT_AR_B }}>
              سجّل مؤسستك
            </button>
            <button onClick={() => setModal("student")}
              className="px-7 py-3 text-sm font-semibold"
              style={{ border: `1px solid rgba(248,243,232,0.4)`, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>
              انضم كطالب
            </button>
          </div>
          <div className="flex flex-wrap gap-6 pt-5" style={{ borderTop: `1px solid ${RULE_D}` }}>
            {[["يونيو 2026", "تاريخ الإطلاق"], ["عكار وشمال لبنان", "نطاق التغطية"], ["أكتوبر–ديسمبر 2026", "مرحلة التجريب"], ["مجاني للمستفيدين", "بلا تكلفة"]].map(([v, l]) => (
              <div key={l} className="flex items-center gap-2">
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(248,243,232,0.45)", display: "inline-block" }} />
                <span style={{ fontFamily: FONT_AR_B, fontSize: 12, color: "rgba(248,243,232,0.85)", fontWeight: 500 }}>{v}</span>
                <span style={{ color: "rgba(248,243,232,0.35)", fontSize: 12 }}>·</span>
                <span style={{ fontFamily: FONT_AR_B, fontSize: 12, color: "rgba(248,243,232,0.5)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Triple-win ── */}
      <section className="py-16 px-6" style={{ background: BG_ALT }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <Eyebrow label="النموذج" />
            <h2 className="font-bold mt-4"
              style={{ fontFamily: FONT_AR_D, fontSize: "clamp(24px,4vw,40px)", color: INK, lineHeight: 1.2 }}>
              نموذج الفوز الثلاثي
            </h2>
            <p style={{ fontFamily: FONT_AR_B, fontSize: 14, color: INK_MUTE, marginTop: 8 }}>
              كل طرف يكسب — هذا ما يجعل مبادرة شمول مستدامة.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {WINS.map(({ mark, title, desc }) => (
              <div key={title} className="p-6"
                style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 6, boxShadow: `0 1px 2px rgba(31,26,20,0.06)` }}>
                <div className="w-10 h-10 flex items-center justify-center mb-4 text-lg"
                  style={{ background: BG_ALT, color: OLIVE, borderRadius: 4 }}>{mark}</div>
                <p className="font-bold text-sm mb-2" style={{ color: OLIVE_D, fontFamily: FONT_AR_D }}>{title}</p>
                <p style={{ fontFamily: FONT_AR_B, fontSize: 13, color: INK_MUTE, lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead quote ── */}
      <section className="py-12 px-6" style={{ background: BG }}>
        <div className="mx-auto max-w-4xl">
          <div className="px-8 py-6" style={{ background: SURFACE, borderInlineEnd: `3px solid ${TERRA}`, borderRadius: "0 4px 4px 0", boxShadow: `0 1px 2px rgba(31,26,20,0.06)` }}>
            <p style={{ fontFamily: FONT_AR_B, fontSize: 15, color: INK_BODY, lineHeight: 1.85 }}>
              <strong style={{ color: OLIVE_D }}>شمول</strong> هو ذراع التطوير المؤسسي المجاني لـ SpotCast المبني على نموذج الفوز الثلاثي —
              يكتسب الطلاب تدريباً مهنياً حقيقياً وشهادة معتمدة، وتحصل المؤسسات على خدمات استشارية متخصصة
              بـ <strong style={{ color: TERRA }}>تكلفة صفرية</strong>، وتبني SpotCast سجل أثر مجتمعي قابل للقياس.
              <strong style={{ color: OLIVE_D }}> الجميع يكسب.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-20 px-6" style={{ background: BG_ALT }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow label="المحاور" />
          <div className="my-10">
            <h2 className="font-bold mb-2" style={{ fontFamily: FONT_AR_D, fontSize: "clamp(24px,4vw,40px)", color: INK, lineHeight: 1.2 }}>
              المحاور الثلاثة للخدمة
            </h2>
            <p style={{ fontFamily: FONT_AR_B, fontSize: 14, color: INK_MUTE }}>
              خبرات متكاملة تغطي كل ما تحتاجه المؤسسة الناشئة.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {PILLARS.map(({ n, tag, title, items }) => (
              <div key={n} style={{ background: SURFACE, border: `1px solid ${RULE_S}`, borderRadius: 6, overflow: "hidden", boxShadow: `0 1px 2px rgba(31,26,20,0.06)` }}>
                <div className="px-5 py-4 flex items-center gap-3" style={{ background: OLIVE_D }}>
                  <div className="flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ width: 28, height: 28, background: "rgba(248,243,232,0.15)", color: ON_DARK, borderRadius: 2, fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif" }}>{n}</div>
                  <p className="font-bold text-sm" style={{ color: ON_DARK, fontFamily: FONT_AR_D }}>{title}</p>
                </div>
                <div className="p-5">
                  <span className="inline-block px-2 py-1 text-xs font-semibold mb-3"
                    style={{ background: BG_ALT, color: OLIVE, border: `1px solid rgba(74,92,57,0.2)`, borderRadius: 2, fontFamily: FONT_AR_B }}>
                    {tag}
                  </span>
                  <ul className="space-y-2">
                    {items.map(item => (
                      <li key={item} className="flex gap-2 text-xs leading-relaxed" style={{ color: INK_BODY, fontFamily: FONT_AR_B, lineHeight: 1.75 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: TERRA, marginTop: 7, flexShrink: 0, display: "inline-block" }} />
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
      <section className="py-20 px-6" style={{ background: BG }}>
        <div className="mx-auto max-w-5xl">
          <Eyebrow label="خطة التوسع" />
          <h2 className="font-bold mt-4 mb-10" style={{ fontFamily: FONT_AR_D, fontSize: "clamp(24px,4vw,40px)", color: INK, lineHeight: 1.2 }}>
            خطة التوسع المرحلي
          </h2>
          <div className="space-y-3">
            {PHASES.map(({ tag, name, period, items }, idx) => (
              <div key={tag} style={{ border: `1px solid ${RULE}`, borderRadius: 4, overflow: "hidden" }}>
                <div className="flex items-stretch">
                  <div className="flex flex-col items-center justify-center text-center px-5 py-4 min-w-[110px]"
                    style={{ background: idx === 0 ? "#6B7F56" : idx === 1 ? OLIVE : OLIVE_D }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(248,243,232,0.75)", fontFamily: FONT_AR_B }}>{tag}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: ON_DARK, fontFamily: FONT_AR_D }}>{name}</p>
                  </div>
                  <div className="flex items-center px-4 py-3 text-sm font-semibold"
                    style={{ background: BG_ALT, color: OLIVE_D, fontFamily: FONT_AR_B, borderInlineStart: `1px solid ${RULE}` }}>
                    {period}
                  </div>
                </div>
                <div className="px-5 py-4" style={{ background: SURFACE, borderTop: `1px solid ${RULE_S}` }}>
                  <div className="grid sm:grid-cols-2 gap-1.5">
                    {items.map(item => (
                      <p key={item} className="flex gap-2 text-xs" style={{ color: INK_BODY, fontFamily: FONT_AR_B, lineHeight: 1.75 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: TERRA, marginTop: 7, flexShrink: 0, display: "inline-block" }} />
                        {item}
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
      <section className="py-16 px-6" style={{ background: BG_ALT }}>
        <div className="mx-auto max-w-5xl text-center">
          <Eyebrow label="القطاعات المستهدفة" />
          <h2 className="font-bold mt-4 mb-8" style={{ fontFamily: FONT_AR_D, fontSize: "clamp(22px,3.5vw,34px)", color: INK }}>
            من يمكنه الاستفادة؟
          </h2>
          <div className="flex flex-wrap justify-center gap-2.5 mb-4">
            {SECTORS.map(s => (
              <span key={s} className="px-4 py-2 text-sm font-medium"
                style={{ background: SURFACE, border: `1.5px solid rgba(74,92,57,0.25)`, color: OLIVE_D, borderRadius: 999, fontFamily: FONT_AR_B }}>
                {s}
              </span>
            ))}
          </div>
          <p style={{ fontFamily: FONT_AR_B, fontSize: 12, color: INK_MUTE, marginTop: 16, fontStyle: "italic" }}>
            نطاق المرحلة الأولى: عكار وشمال لبنان فقط
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" className="py-24 px-6" style={{ position: "relative", overflow: "hidden",
        background: "radial-gradient(ellipse at 30% 20%, rgba(122,143,94,0.45), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(58,74,44,0.55), transparent 60%), linear-gradient(135deg, #5E7349 0%, #3A4A2C 100%)"
      }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`, opacity: 0.5, mixBlendMode: "overlay" as const, pointerEvents: "none" as const }} />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <Eyebrow label="انضم إلينا" onDark />
          <h2 className="font-extrabold mt-4 mb-4"
            style={{ fontFamily: FONT_AR_D, fontSize: "clamp(30px,5vw,56px)", color: ON_DARK, lineHeight: 1.15 }}>
            مؤسستك تستحق أن تنمو.
          </h2>
          <p className="mb-10 max-w-xl mx-auto leading-relaxed"
            style={{ fontFamily: FONT_AR_B, fontSize: 15, color: "rgba(248,243,232,0.8)", lineHeight: 1.85 }}>
            لا رسوم، لا شروط معقدة. فقط التزام حقيقي بالتطوير وفريق طلابي متحمس يعمل معك.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button onClick={() => setModal("institution")}
              className="flex items-center gap-3 px-8 py-4 text-sm font-bold"
              style={{ background: ON_DARK, color: OLIVE_D, borderRadius: 2, fontFamily: FONT_AR_B }}>
              سجّل مؤسستك
            </button>
            <button onClick={() => setModal("student")}
              className="flex items-center gap-3 px-8 py-4 text-sm font-bold"
              style={{ border: `2px solid rgba(248,243,232,0.45)`, color: ON_DARK, borderRadius: 2, fontFamily: FONT_AR_B }}>
              انضم كطالب
            </button>
          </div>
        </div>
      </section>

      {/* ── Partner logos ── */}
      <section className="py-14 px-6" style={{ background: BG_ALT, borderTop: `1px solid ${RULE}` }}>
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <Eyebrow label="شركاؤنا" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <ShumulLogo size={44} variant="light" />
                <div>
                  <p className="font-extrabold" style={{ fontFamily: FONT_AR_D, fontSize: 18, color: OLIVE_D }}>شمول</p>
                  <p style={{ fontFamily: FONT_AR_B, fontSize: 10, color: INK_MUTE, letterSpacing: "0.1em" }}>SHUMUL FOR AWARENESS & CULTURE</p>
                </div>
              </div>
            </div>
            <div style={{ width: 1, height: 48, background: RULE }} />
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <InjazLogo size={44} />
                <div>
                  <p className="font-bold" style={{ fontFamily: "var(--font-barlow-condensed), 'Barlow Condensed', sans-serif", fontSize: 18, color: INK, letterSpacing: "-0.01em" }}>INJAZ</p>
                  <p style={{ fontFamily: "var(--font-barlow), 'Barlow', sans-serif", fontSize: 11, color: INK_MUTE }}>Lebanon · Member of JA Worldwide</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ background: OLIVE_D }}>
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={28} variant="white" />
            <div>
              <p className="text-xs font-bold" style={{ color: ON_DARK, fontFamily: FONT_AR_D }}>مبادرة شمول للتطوير المؤسسي</p>
              <p className="text-xs" style={{ color: "rgba(248,243,232,0.55)", fontFamily: FONT_AR_B }}>مبادرة SpotCast · عكار والشمال · لبنان · 2026</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs font-semibold" style={{ color: "#C9A96E", fontFamily: FONT_AR_B }}>مسؤول البرنامج</p>
            <p className="text-xs" style={{ color: ON_DARK, fontFamily: FONT_AR_D }}>عمر خالد — المدير التنفيذي، SpotCast</p>
            <a href="mailto:Omar.khaled@spotcast.press" className="text-xs" style={{ color: "rgba(248,243,232,0.55)" }}>Omar.khaled@spotcast.press</a>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs font-semibold" style={{ color: "#C9A96E", fontFamily: FONT_AR_B }}>منسق الميدان</p>
            <p className="text-xs" style={{ color: ON_DARK, fontFamily: FONT_AR_D }}>بشير الرفاعي — مدير المشروع</p>
            <a href="mailto:alrifaibashir66@gmail.com" className="text-xs" style={{ color: "rgba(248,243,232,0.55)" }}>alrifaibashir66@gmail.com</a>
          </div>
          <a href="/" className="text-xs" style={{ color: "rgba(248,243,232,0.45)", fontFamily: FONT_AR_B }}>← العودة إلى شمول هاب</a>
        </div>
      </footer>

      {/* ── Modals ── */}
      {modal === "institution" && !done && (
        <Modal title="سجّل مؤسستك" subtitle="خدمات تطوير مؤسسي مجانية — عكار وشمال لبنان" onClose={() => setModal(null)}>
          <InstitutionForm onDone={() => { setModal(null); setDone("institution"); }} />
        </Modal>
      )}
      {modal === "student" && !done && (
        <Modal title="انضم كطالب" subtitle="التزام 6 أشهر · شهادة معتمدة · تدريب ميداني حقيقي" onClose={() => setModal(null)}>
          <StudentForm onDone={() => { setModal(null); setDone("student"); }} />
        </Modal>
      )}
      {done === "institution" && (
        <Modal title="شكراً لكم" subtitle="" onClose={() => setDone(null)}>
          <SuccessView message="تم استلام طلب تسجيلكم. سيتواصل معكم عمر خالد وبشير الرفاعي خلال 48 ساعة." onClose={() => setDone(null)} />
        </Modal>
      )}
      {done === "student" && (
        <Modal title="تم استلام طلبك" subtitle="" onClose={() => setDone(null)}>
          <SuccessView message="تم تقديم طلبك بنجاح. سنراجعه ونتواصل معك قريباً." onClose={() => setDone(null)} />
        </Modal>
      )}
    </div>
  );
}
