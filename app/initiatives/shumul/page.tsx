"use client";

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
        <span className="text-xs tracking-widest uppercase" style={{ color: ROSE, fontFamily: "monospace" }}>
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
    items: [
      "أنظمة محاسبية ومالية",
      "التخطيط المالي ونماذج الاستدامة",
      "إرشادات الدفع الرقمي",
      "سياسات المخزون والتسعير",
    ],
  },
  {
    n: "02",
    title: "الامتثال القانوني والمقترحات",
    items: [
      "التسجيل القانوني وملفات المناقصات",
      "دليل الامتثال الضريبي",
      "كتابة المقترحات وطلبات المنح",
      "ملفات العروض والتقديم للمانحين",
    ],
  },
  {
    n: "03",
    title: "الحضور الرقمي والتواصل",
    items: [
      "التدقيق الرقمي وإعداد حسابات التواصل الاجتماعي",
      "بناء الموقع الإلكتروني",
      "خطة المحتوى الشهرية",
      "تدريب الفريق على الأدوات الرقمية",
    ],
  },
];

const STEPS = [
  {
    n: "١",
    title: "المؤسسة تتقدم",
    desc: "تُسجّل المؤسسة الناشئة طلبها عبر نموذج بسيط. يتضمن وصفاً لطبيعة عملها واحتياجاتها.",
  },
  {
    n: "٢",
    title: "فريق الطلاب يُشخّص",
    desc: "فريق من طلاب الجامعات يزور المؤسسة ويُجري تحليلاً ميدانياً دقيقاً لتحديد الأولويات.",
  },
  {
    n: "٣",
    title: "خطة عمل تُنفَّذ خلال ٦ أشهر",
    desc: "يُنجز الفريق خطة عمل شاملة مع المؤسسة ويتابع تنفيذها خطوة بخطوة على مدى ستة أشهر.",
  },
];

const BENEFICIARIES = [
  "جمعيات الشباب والمبادرات المجتمعية",
  "المشاريع الصغيرة والمتناهية الصغر",
  "التعاونيات المحلية",
  "المبادرات البلدية",
];

export default function ShumulInitiativePage() {
  return (
    <div className="min-h-screen" style={{ background: "#fff", color: NAVY }} dir="rtl">

      {/* ── Nav ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-sm"
        style={{ background: "rgba(255,255,255,0.95)", borderBottom: `1px solid ${ROSE}22` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <SpotCastLogo size={36} variant="color" />
            <div>
              <p className="text-sm font-bold leading-tight" style={{ color: NAVY }}>مبادرة شمول</p>
              <p className="text-xs leading-tight" style={{ color: GRAY, fontFamily: "monospace" }}>
                للتطوير المؤسسي · عكار والشمال
              </p>
            </div>
          </div>
          <a
            href="#register"
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ background: ROSE }}
          >
            سجّل مؤسستك
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: NAVY, minHeight: "70vh" }} className="flex items-center px-6 py-20">
        <div className="mx-auto w-full max-w-4xl text-center text-white">
          <p className="mb-4 text-xs tracking-widest uppercase" style={{ color: ROSE, fontFamily: "monospace" }}>
            SpotCast · مبادرة مجانية ممولة بالكامل
          </p>
          <h1 className="text-4xl font-bold leading-snug mb-4 md:text-5xl" style={{ fontFamily: "Georgia, serif" }}>
            مبادرة شمول للتطوير المؤسسي
          </h1>
          <p className="text-xl mb-3" style={{ color: ROSE, fontFamily: "Georgia, serif" }}>
            مؤسسات تنمو · شباب يتعلم · اقتصاد يتحرك
          </p>
          <p className="text-base mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: GRAY }}>
            خدمات تطوير مؤسسي مجانية للمؤسسات الناشئة في عكار والشمال — مقدَّمة من فرق طلابية
            متخصصة بإشراف مهني، ضمن نموذج ممول بالكامل من المانحين.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#register"
              className="rounded-full px-8 py-3 text-sm font-bold text-white"
              style={{ background: ROSE }}
            >
              سجّل مؤسستك ←
            </a>
            <a
              href="#students"
              className="rounded-full px-8 py-3 text-sm font-semibold transition-colors"
              style={{ border: `1px solid ${GRAY}`, color: GRAY }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = ROSE; e.currentTarget.style.color = ROSE; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = GRAY; e.currentTarget.style.color = GRAY; }}
            >
              انضم كطالب
            </a>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {[["٣", "محاور"], ["٦", "أشهر"], ["٠$", "رسوم"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-3xl font-bold" style={{ color: ROSE, fontFamily: "Georgia, serif" }}>{n}</p>
                <p className="text-xs tracking-wider" style={{ color: GRAY, fontFamily: "monospace" }}>{l}</p>
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
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              ما الذي نقدمه؟
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              ثلاثة محاور متكاملة تُغطّي كل ما تحتاجه المؤسسة الناشئة لتنطلق بثقة.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map(({ n, title, items }) => (
              <div
                key={n}
                className="rounded-xl bg-white p-7"
                style={{ border: `1px solid ${ROSE}22`, boxShadow: `0 2px 16px ${NAVY}08` }}
              >
                <span className="text-3xl font-bold block mb-3" style={{ fontFamily: "monospace", color: ROSE }}>
                  {n}
                </span>
                <h3 className="text-base font-bold mb-4" style={{ color: NAVY }}>{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm" style={{ color: GRAY }}>
                      <span style={{ color: ROSE, flexShrink: 0 }}>●</span>
                      {item}
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
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              كيف تعمل المبادرة؟
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="relative rounded-xl p-7 text-center"
                style={{ background: LIGHT, border: `1px solid ${ROSE}22` }}
              >
                <span
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold text-white mb-4"
                  style={{ background: ROSE, fontFamily: "Georgia, serif" }}
                >
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
          <Divider label="للطلاب" />
          <div className="my-10 grid items-center gap-12 md:grid-cols-2">
            <div className="text-white">
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: "Georgia, serif" }}>
                انضم كطالب —<br />
                <span style={{ color: ROSE }}>تعلّم من الواقع.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: GRAY }}>
                المبادرة ليست فرصة تطوع عادية. هي تجربة مهنية حقيقية على أرض الواقع — تُشخّص
                مؤسسة ناشئة وتبني لها خطة عمل وتتابع تنفيذها.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "التزام ٦ أشهر مع شهادة مشاركة معتمدة",
                  "تدريب مهني حقيقي في البيئة الميدانية",
                  "دعم النقل للطلاب من خارج المنطقة",
                  "إشراف مباشر من فريق SpotCast",
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-sm" style={{ color: GRAY }}>
                    <span style={{ color: ROSE }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <div
                className="rounded-xl p-5"
                style={{ background: "#122033", border: `1px solid ${ROSE}22` }}
              >
                <p className="text-xs mb-1" style={{ fontFamily: "monospace", color: ROSE }}>شريك التوظيف</p>
                <p className="text-sm font-bold text-white">INJAZ Lebanon</p>
                <p className="text-xs mt-1" style={{ color: GRAY }}>
                  يتولى التوظيف وتنسيق دعم التنقل للطلاب من جميع الجامعات
                </p>
              </div>
            </div>
            <div>
              <div
                className="rounded-xl p-7"
                style={{ background: "#122033", border: `1px solid ${ROSE}22` }}
              >
                <p className="text-xs tracking-widest uppercase mb-4" style={{ fontFamily: "monospace", color: ROSE }}>
                  الجامعات المستهدفة
                </p>
                {["جامعة اللبنانية الدولية — LIU", "الجامعة الأمريكية للتكنولوجيا — AUT", "جامعة البلمند", "طلاب عكار في الجامعات الأخرى"].map((u) => (
                  <div key={u} className="flex gap-2 items-center py-2" style={{ borderBottom: `1px solid ${ROSE}15` }}>
                    <span style={{ color: ROSE }}>◆</span>
                    <span className="text-sm text-white">{u}</span>
                  </div>
                ))}
                <a
                  href={`mailto:Omar.khaled@spotcast.press?subject=انضمام طالب - مبادرة شمول`}
                  className="mt-5 inline-block w-full text-center rounded-full py-3 text-sm font-bold text-white"
                  style={{ background: ROSE }}
                >
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
          <Divider label="المستفيدون المستهدفون" />
          <div className="text-center my-10">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "Georgia, serif", color: NAVY }}>
              من يمكنه الاستفادة؟
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: GRAY }}>
              المرحلة الأولى مخصصة للمؤسسات الناشئة في عكار والشمال فقط.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {BENEFICIARIES.map((b) => (
              <div
                key={b}
                className="flex items-center gap-4 rounded-xl bg-white px-6 py-5"
                style={{ border: `1px solid ${ROSE}22`, boxShadow: `0 2px 12px ${NAVY}06` }}
              >
                <span className="text-2xl" style={{ color: ROSE }}>◆</span>
                <p className="text-sm font-medium" style={{ color: NAVY }}>{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs" style={{ fontFamily: "monospace", color: GRAY }}>
            المرحلة الأولى: عكار والشمال حصراً · سيتم التوسع لاحقاً
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="register" className="py-24 px-6" style={{ background: ROSE }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs tracking-widest uppercase text-white/80" style={{ fontFamily: "monospace" }}>
            ابدأ الآن
          </p>
          <h2 className="text-4xl font-bold text-white mb-6" style={{ fontFamily: "Georgia, serif" }}>
            مؤسستك تستحق أن تنمو.
          </h2>
          <p className="text-base mb-10 max-w-xl mx-auto text-white/80 leading-relaxed">
            لا رسوم، لا شروط معقدة. فقط التزام حقيقي بالتطوير وفريق طلابي متحمس يعمل معك.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={`mailto:Omar.khaled@spotcast.press?subject=تسجيل مؤسسة - مبادرة شمول`}
              className="flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-white"
              style={{ background: NAVY }}
            >
              <span>✉</span>
              <span>سجّل مؤسستك الآن</span>
            </a>
            <a
              href={`mailto:Omar.khaled@spotcast.press?subject=انضمام طالب - مبادرة شمول`}
              className="flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-white"
              style={{ background: "rgba(255,255,255,0.25)" }}
            >
              <span>🎓</span>
              <span>انضم كطالب</span>
            </a>
          </div>
          <p className="mt-5 text-xs text-white/60" style={{ fontFamily: "monospace" }}>
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
              <p className="text-xs font-semibold text-white">مبادرة شمول للتطوير المؤسسي</p>
              <p className="text-xs" style={{ fontFamily: "monospace", color: GRAY }}>
                مبادرة SpotCast · عكار والشمال · لبنان
              </p>
            </div>
          </div>
          <a
            href="/"
            className="text-xs"
            style={{ fontFamily: "monospace", color: GRAY }}
            onMouseOver={(e) => (e.currentTarget.style.color = ROSE)}
            onMouseOut={(e) => (e.currentTarget.style.color = GRAY)}
          >
            ← العودة إلى موقع شمول
          </a>
          <a
            href="mailto:Omar.khaled@spotcast.press"
            className="text-xs"
            style={{ fontFamily: "monospace", color: GRAY }}
            onMouseOver={(e) => (e.currentTarget.style.color = ROSE)}
            onMouseOut={(e) => (e.currentTarget.style.color = GRAY)}
          >
            Omar.khaled@spotcast.press
          </a>
        </div>
      </footer>
    </div>
  );
}
