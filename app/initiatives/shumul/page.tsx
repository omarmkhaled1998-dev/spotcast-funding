"use client";

import Link from "next/link";
import { SpotCastLogo } from "@/components/hub/SpotCastLogo";

const ROSE = "#C4607A";
const NAVY = "#0e2334";
const GRAY = "#839ba3";
const LIGHT = "#f5f3f0";
const FONT = "var(--font-cairo), 'Cairo', 'Segoe UI', sans-serif";

function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px" style={{ background: `${ROSE}30` }} />
      {label && (
        <span style={{ color: ROSE, fontFamily: FONT, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
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
    title: "الأنظمة المالية والاستدامة",
    items: ["أنظمة محاسبية ومالية", "التخطيط المالي ونماذج الاستدامة", "إرشادات الدفع الرقمي", "سياسات المخزون والتسعير"],
  },
  {
    n: "02",
    title: "الامتثال القانوني والمقترحات",
    items: ["التسجيل القانوني وملفات المناقصات", "دليل الامتثال الضريبي", "كتابة المقترحات وطلبات المنح", "ملفات العروض والتقديم للمانحين"],
  },
  {
    n: "03",
    title: "الحضور الرقمي والتواصل",
    items: ["التدقيق الرقمي وإعداد حسابات التواصل الاجتماعي", "بناء الموقع الإلكتروني", "خطة المحتوى الشهرية", "تدريب الفريق على الأدوات الرقمية"],
  },
];

const STEPS = [
  { n: "١", title: "المؤسسة تتقدم", desc: "تُسجّل المؤسسة الناشئة طلبها عبر نموذج بسيط. يتضمن وصفاً لطبيعة عملها واحتياجاتها." },
  { n: "٢", title: "فريق الطلاب يُشخّص", desc: "فريق من طلاب الجامعات يزور المؤسسة ويُجري تحليلاً ميدانياً دقيقاً لتحديد الأولويات." },
  { n: "٣", title: "خطة عمل تُنفَّذ خلال ٦ أشهر", desc: "يُنجز الفريق خطة عمل شاملة مع المؤسسة ويتابع تنفيذها خطوة بخطوة على مدى ستة أشهر." },
];

const BENEFICIARIES = [
  "جمعيات الشباب والمبادرات المجتمعية",
  "المشاريع الصغيرة والمتناهية الصغر",
  "التعاونيات المحلية",
  "المبادرات البلدية",
];

export default function ShumulInitiativeArabic() {
  return (
    <div className="min-h-screen" style={{ background: "#fff", color: NAVY, fontFamily: FONT }} dir="rtl">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.96)", borderBottom: `1px solid ${ROSE}22` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={36} variant="color" />
            <div>
              <p className="font-bold leading-tight" style={{ color: NAVY, fontSize: 15, fontFamily: FONT }}>مبادرة شمول</p>
              <p style={{ color: GRAY, fontFamily: FONT, fontSize: 12 }}>للتطوير المؤسسي · عكار والشمال</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/initiatives/shumul/en"
              style={{ fontFamily: FONT, fontSize: 12, color: GRAY, border: `1px solid ${GRAY}44`, borderRadius: 20, padding: "4px 14px" }}
              className="hover:border-rose-400 hover:text-rose-500 transition-colors"
            >
              English
            </Link>
            <a href="#register" className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: ROSE, fontFamily: FONT }}>
              سجّل مؤسستك
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: NAVY, minHeight: "68vh" }} className="flex items-center px-6 py-20">
        <div className="mx-auto w-full max-w-4xl text-center text-white">
          <p style={{ color: ROSE, fontFamily: FONT, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
            SpotCast · مبادرة مجانية ممولة بالكامل
          </p>
          <h1 className="font-extrabold leading-snug mb-4" style={{ fontSize: "clamp(28px, 5vw, 48px)", fontFamily: FONT }}>
            مبادرة شمول للتطوير المؤسسي
          </h1>
          <p className="font-semibold mb-4" style={{ fontSize: "clamp(16px, 2.5vw, 22px)", color: ROSE, fontFamily: FONT }}>
            مؤسسات تنمو · شباب يتعلم · اقتصاد يتحرك
          </p>
          <p className="mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: GRAY, fontFamily: FONT, fontSize: 15 }}>
            خدمات تطوير مؤسسي مجانية للمؤسسات الناشئة في عكار والشمال — مقدَّمة من فرق طلابية متخصصة
            بإشراف مهني، ضمن نموذج ممول بالكامل من المانحين.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#register" className="rounded-full px-8 py-3 font-bold text-white" style={{ background: ROSE, fontFamily: FONT, fontSize: 14 }}>
              سجّل مؤسستك ←
            </a>
            <a href="#students" className="rounded-full px-8 py-3 font-semibold" style={{ border: `1px solid ${GRAY}`, color: GRAY, fontFamily: FONT, fontSize: 14 }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = ROSE; e.currentTarget.style.color = ROSE; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY; }}
            >
              انضم كطالب
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-xs mx-auto">
            {[["٣", "محاور"], ["٦", "أشهر"], ["٠$", "رسوم"]].map(([n, l]) => (
              <div key={l}>
                <p className="font-extrabold" style={{ color: ROSE, fontFamily: FONT, fontSize: 30 }}>{n}</p>
                <p style={{ color: GRAY, fontFamily: FONT, fontSize: 12 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-6xl">
          <Divider label="المحاور الثلاثة" />
          <div className="text-center my-10">
            <h2 className="font-bold mb-3" style={{ fontFamily: FONT, fontSize: "clamp(22px,4vw,34px)", color: NAVY }}>ما الذي نقدمه؟</h2>
            <p style={{ color: GRAY, fontFamily: FONT, fontSize: 14, maxWidth: 480, margin: "0 auto" }}>
              ثلاثة محاور متكاملة تُغطّي كل ما تحتاجه المؤسسة الناشئة لتنطلق بثقة.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ n, title, items }) => (
              <div key={n} className="rounded-2xl bg-white p-7" style={{ border: `1px solid ${ROSE}22`, boxShadow: `0 2px 20px ${NAVY}08` }}>
                <span className="font-black block mb-3" style={{ fontFamily: FONT, fontSize: 28, color: ROSE }}>{n}</span>
                <h3 className="font-bold mb-4" style={{ fontFamily: FONT, fontSize: 16, color: NAVY }}>{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2" style={{ fontFamily: FONT, fontSize: 14, color: GRAY }}>
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
          <Divider label="آلية العمل" />
          <div className="text-center my-10">
            <h2 className="font-bold mb-3" style={{ fontFamily: FONT, fontSize: "clamp(22px,4vw,34px)", color: NAVY }}>كيف تعمل المبادرة؟</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="relative rounded-2xl p-7 text-center" style={{ background: LIGHT, border: `1px solid ${ROSE}22` }}>
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full font-extrabold text-white mb-4" style={{ background: ROSE, fontFamily: FONT, fontSize: 22 }}>{n}</span>
                <h3 className="font-bold mb-2" style={{ fontFamily: FONT, fontSize: 16, color: NAVY }}>{title}</h3>
                <p className="leading-relaxed" style={{ fontFamily: FONT, fontSize: 13, color: GRAY }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Students ── */}
      <section id="students" className="py-20 px-6" style={{ background: NAVY }}>
        <div className="mx-auto max-w-5xl">
          <Divider label="للطلاب" />
          <div className="my-10 grid items-center gap-12 md:grid-cols-2">
            <div className="text-white">
              <h2 className="font-bold mb-6" style={{ fontFamily: FONT, fontSize: "clamp(22px,4vw,32px)" }}>
                انضم كطالب —<br /><span style={{ color: ROSE }}>تعلّم من الواقع.</span>
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: GRAY, fontFamily: FONT, fontSize: 14 }}>
                المبادرة ليست فرصة تطوع عادية. هي تجربة مهنية حقيقية على أرض الواقع — تُشخّص مؤسسة ناشئة وتبني لها خطة عمل وتتابع تنفيذها.
              </p>
              <ul className="space-y-3 mb-6">
                {["التزام ٦ أشهر مع شهادة مشاركة معتمدة", "تدريب مهني حقيقي في البيئة الميدانية", "دعم النقل للطلاب من خارج المنطقة", "إشراف مباشر من فريق SpotCast"].map((item) => (
                  <li key={item} className="flex gap-2" style={{ fontFamily: FONT, fontSize: 14, color: GRAY }}>
                    <span style={{ color: ROSE }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div className="rounded-xl p-5" style={{ background: "#122033", border: `1px solid ${ROSE}22` }}>
                <p style={{ fontFamily: FONT, fontSize: 11, color: ROSE, marginBottom: 4 }}>شريك التوظيف</p>
                <p className="font-bold text-white" style={{ fontFamily: FONT, fontSize: 15 }}>INJAZ Lebanon</p>
                <p style={{ color: GRAY, fontFamily: FONT, fontSize: 13, marginTop: 4 }}>يتولى التوظيف وتنسيق دعم التنقل للطلاب من جميع الجامعات</p>
              </div>
            </div>
            <div>
              <div className="rounded-2xl p-7" style={{ background: "#122033", border: `1px solid ${ROSE}22` }}>
                <p style={{ fontFamily: FONT, fontSize: 11, color: ROSE, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>الجامعات المستهدفة</p>
                {["جامعة اللبنانية الدولية — LIU", "الجامعة الأمريكية للتكنولوجيا — AUT", "جامعة البلمند", "طلاب عكار في الجامعات الأخرى"].map((u) => (
                  <div key={u} className="flex gap-2 items-center py-3" style={{ borderBottom: `1px solid ${ROSE}15` }}>
                    <span style={{ color: ROSE }}>◆</span>
                    <span className="text-white" style={{ fontFamily: FONT, fontSize: 14 }}>{u}</span>
                  </div>
                ))}
                <a href={`mailto:Omar.khaled@spotcast.press?subject=انضمام طالب - مبادرة شمول`}
                  className="mt-5 block text-center rounded-full py-3 font-bold text-white"
                  style={{ background: ROSE, fontFamily: FONT, fontSize: 14 }}>
                  انضم كطالب ←
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Beneficiaries ── */}
      <section className="py-20 px-6" style={{ background: LIGHT }}>
        <div className="mx-auto max-w-5xl">
          <Divider label="المستفيدون" />
          <div className="text-center my-10">
            <h2 className="font-bold mb-3" style={{ fontFamily: FONT, fontSize: "clamp(22px,4vw,34px)", color: NAVY }}>من يمكنه الاستفادة؟</h2>
            <p style={{ color: GRAY, fontFamily: FONT, fontSize: 14, maxWidth: 440, margin: "0 auto" }}>
              المرحلة الأولى مخصصة للمؤسسات الناشئة في عكار والشمال فقط.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {BENEFICIARIES.map((b) => (
              <div key={b} className="flex items-center gap-4 rounded-2xl bg-white px-6 py-5" style={{ border: `1px solid ${ROSE}22`, boxShadow: `0 2px 12px ${NAVY}06` }}>
                <span style={{ color: ROSE, fontSize: 18, flexShrink: 0 }}>◆</span>
                <p className="font-medium" style={{ fontFamily: FONT, fontSize: 15, color: NAVY }}>{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center" style={{ fontFamily: FONT, fontSize: 12, color: GRAY }}>
            المرحلة الأولى: عكار والشمال حصراً · سيتم التوسع لاحقاً
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" className="py-24 px-6" style={{ background: ROSE }}>
        <div className="mx-auto max-w-4xl text-center">
          <p style={{ fontFamily: FONT, fontSize: 11, color: "rgba(255,255,255,0.8)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>ابدأ الآن</p>
          <h2 className="font-extrabold text-white mb-6" style={{ fontFamily: FONT, fontSize: "clamp(26px,5vw,44px)" }}>
            مؤسستك تستحق أن تنمو.
          </h2>
          <p className="mb-10 max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.82)", fontFamily: FONT, fontSize: 15 }}>
            لا رسوم، لا شروط معقدة. فقط التزام حقيقي بالتطوير وفريق طلابي متحمس يعمل معك.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href={`mailto:Omar.khaled@spotcast.press?subject=تسجيل مؤسسة - مبادرة شمول`}
              className="flex items-center gap-3 rounded-full px-7 py-4 font-bold text-white"
              style={{ background: NAVY, fontFamily: FONT, fontSize: 14 }}>
              <span>✉</span><span>سجّل مؤسستك الآن</span>
            </a>
            <a href={`mailto:Omar.khaled@spotcast.press?subject=انضمام طالب - مبادرة شمول`}
              className="flex items-center gap-3 rounded-full px-7 py-4 font-bold text-white"
              style={{ background: "rgba(255,255,255,0.25)", fontFamily: FONT, fontSize: 14 }}>
              <span>🎓</span><span>انضم كطالب</span>
            </a>
          </div>
          <p className="mt-5" style={{ fontFamily: FONT, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            Omar.khaled@spotcast.press · مسؤول المبادرة: بشير الرفاعي
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-10" style={{ background: NAVY, borderTop: `1px solid ${ROSE}22` }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={30} variant="white" />
            <div>
              <p className="font-semibold text-white" style={{ fontFamily: FONT, fontSize: 13 }}>مبادرة شمول للتطوير المؤسسي</p>
              <p style={{ fontFamily: FONT, fontSize: 12, color: GRAY }}>مبادرة SpotCast · عكار والشمال · لبنان</p>
            </div>
          </div>
          <a href="/" style={{ fontFamily: FONT, fontSize: 12, color: GRAY }}
            onMouseOver={(e) => (e.currentTarget.style.color = ROSE)}
            onMouseOut={(e) => (e.currentTarget.style.color = GRAY)}>
            ← العودة إلى موقع شمول
          </a>
          <a href="mailto:Omar.khaled@spotcast.press" style={{ fontFamily: FONT, fontSize: 12, color: GRAY }}
            onMouseOver={(e) => (e.currentTarget.style.color = ROSE)}
            onMouseOut={(e) => (e.currentTarget.style.color = GRAY)}>
            Omar.khaled@spotcast.press
          </a>
        </div>
      </footer>
    </div>
  );
}
