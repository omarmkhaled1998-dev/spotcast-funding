import Link from "next/link";
import { Radio, Search, Zap, BarChart3, Bell, Users, CheckCircle, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: Search,
    title: "Automated Opportunity Discovery",
    description:
      "We continuously scrape Daleel Madani, Earth Journalism Network, For9a, and your custom sources — so new grants appear in your dashboard, not your inbox.",
  },
  {
    icon: Zap,
    title: "AI-Powered Fit Scoring",
    description:
      "Every opportunity is scored against your organization's mission, geography, and thematic focus. Stop reading listings that were never a match.",
  },
  {
    icon: BarChart3,
    title: "Full Pipeline Tracking",
    description:
      "Move grants from Discovered → Applied → Won/Rejected. Track tasks, notes, and deadlines. Built for the way funding teams actually work.",
  },
  {
    icon: Bell,
    title: "Deadline Alerts",
    description:
      "Never miss a closing date. Set per-opportunity reminders and receive digest emails for high-scoring opportunities before they close.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite colleagues as Admins, Members, or Viewers. Shared notes and tasks keep everyone aligned across your pipeline.",
  },
];

const PLANS = [
  {
    name: "Individual",
    price: "$49",
    period: "/month",
    description: "For freelancers, journalists, and independent researchers.",
    cta: "Start free trial",
    features: [
      "1 user",
      "Up to 3 tracked sources",
      "20 AI scoring requests / day",
      "Full pipeline & task management",
      "14-day free trial",
    ],
    highlighted: false,
  },
  {
    name: "Organization",
    price: "$199",
    period: "/month",
    description: "For NGOs, media organizations, and foundations.",
    cta: "Start free trial",
    features: [
      "Up to 5 users",
      "Up to 10 tracked sources",
      "100 AI scoring requests / day",
      "Daily digest email alerts",
      "Org profile & team roles",
      "14-day free trial",
    ],
    highlighted: true,
  },
  {
    name: "Org + Alerts Plus",
    price: "$298",
    period: "/month",
    description: "Everything in Organization, plus advanced alert controls.",
    cta: "Start free trial",
    features: [
      "Everything in Organization",
      "Unlimited alert recipients",
      "Immediate alerts on new matches",
      "Custom alert templates",
      "Weekly briefing digest",
    ],
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
              <Radio size={18} className="text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">SpotCast</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors md:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
            </span>
            14-day free trial · No credit card required
          </div>

          <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Stop hunting grants.<br />
            <span className="text-indigo-600">Start winning them.</span>
          </h1>

          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            SpotCast automatically discovers funding opportunities across MENA, scores each one
            against your profile, and tracks your entire pipeline — so your team stays focused on
            writing proposals, not reading listings.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors"
            >
              Start free trial
              <ArrowRight size={18} />
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-slate-300 px-7 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              See how it works
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            14 days free · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Social proof strip ────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-6">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
            Trusted by media organizations and NGOs across MENA
          </p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Everything your funding team needs
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              From automated discovery to proposal tracking — SpotCast handles the full funding
              lifecycle in one place.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-6 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Up and running in minutes
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create your profile",
                desc: "Tell SpotCast your mission, thematic areas, geography, and grant eligibility. Takes 5 minutes.",
              },
              {
                step: "2",
                title: "We find the opportunities",
                desc: "SpotCast scrapes 3 curated MENA funding sources daily and scores every opportunity against your profile.",
              },
              {
                step: "3",
                title: "Track and win",
                desc: "Move grants through your pipeline, assign tasks to teammates, and get alerts before deadlines close.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                  {step}
                </div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Start free for 14 days. No credit card required.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlighted
                    ? "border-indigo-500 bg-indigo-600 text-white shadow-xl"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                    Most popular
                  </div>
                )}
                <div>
                  <p className={`text-sm font-semibold ${plan.highlighted ? "text-indigo-200" : "text-slate-500"}`}>
                    {plan.name}
                  </p>
                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className={`mb-1 text-sm ${plan.highlighted ? "text-indigo-200" : "text-slate-400"}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm leading-relaxed ${plan.highlighted ? "text-indigo-100" : "text-slate-500"}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle
                        size={16}
                        className={`mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-indigo-200" : "text-indigo-500"}`}
                      />
                      <span className={plan.highlighted ? "text-indigo-50" : "text-slate-700"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-indigo-600 py-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to find your next grant?
          </h2>
          <p className="mt-4 text-lg text-indigo-200">
            Join organizations across MENA managing their funding pipeline with SpotCast.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow hover:bg-indigo-50 transition-colors"
          >
            Start your free trial
            <ArrowRight size={18} />
          </Link>
          <p className="mt-4 text-sm text-indigo-300">
            14 days free · No credit card required
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-10 px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <Radio size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800">SpotCast</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} SpotCast. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-400">
            <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
            <Link href="/login" className="hover:text-slate-600 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
