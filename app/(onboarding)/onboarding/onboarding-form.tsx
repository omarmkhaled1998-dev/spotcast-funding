"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Newspaper,
  Globe,
  Leaf,
  Vote,
  GraduationCap,
  MoreHorizontal,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { addSource } from "@/lib/actions/sources";
import { saveOrgProfile } from "@/lib/actions/profiles";

// ── Focus options (Step 1) ─────────────────────────────────────────────────────
const FOCUS_OPTIONS = [
  { value: "Media & Journalism",    icon: Newspaper,     color: "indigo" },
  { value: "Human Rights",          icon: Globe,         color: "rose" },
  { value: "Environment & Climate", icon: Leaf,          color: "green" },
  { value: "Democracy & Governance",icon: Vote,          color: "amber" },
  { value: "Education & Youth",     icon: GraduationCap, color: "sky" },
  { value: "Other",                 icon: MoreHorizontal, color: "slate" },
] as const;

const COLOR_MAP: Record<string, string> = {
  indigo: "border-indigo-300 bg-indigo-50 text-indigo-700 ring-indigo-400",
  rose:   "border-rose-300   bg-rose-50   text-rose-700   ring-rose-400",
  green:  "border-green-300  bg-green-50  text-green-700  ring-green-400",
  amber:  "border-amber-300  bg-amber-50  text-amber-700  ring-amber-400",
  sky:    "border-sky-300    bg-sky-50    text-sky-700    ring-sky-400",
  slate:  "border-slate-300  bg-slate-50  text-slate-600  ring-slate-400",
};

// ── Built-in sources (Step 2) ──────────────────────────────────────────────────
const BUILTIN_SOURCES: {
  id: string;
  name: string;
  url: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    id: "daleel",
    name: "Daleel Madani",
    url: "https://daleel-madani.org/calls-for-proposal",
    description: "Arab civil society grants & opportunities",
    recommended: true,
  },
  {
    id: "for9a",
    name: "For9a",
    url: "https://www.for9a.com/en",
    description: "Jobs, internships & grants across MENA",
  },
  {
    id: "ejn",
    name: "Earth Journalism Network",
    url: "https://earthjournalism.net/opportunities",
    description: "Environment & climate journalism funds",
  },
];

interface Props {
  workspaceId: string;
  workspaceName: string;
  wsType: "ORG" | "INDIVIDUAL";
  userId: string;
}

export function OnboardingForm({ workspaceId, workspaceName, wsType, userId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);
  const [focus, setFocus] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(["daleel"]);
  const [customUrl, setCustomUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1: focus ───────────────────────────────────────────────────────────
  function toggleFocus(value: string) {
    setFocus((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value].slice(0, 3)
    );
  }

  // ── Step 2: submit ──────────────────────────────────────────────────────────
  async function handleStart() {
    setLoading(true);
    setError("");

    try {
      // 1. Save minimal profile (focus themes only)
      const profileData = new FormData();
      focus.forEach((f) => profileData.append("thematicAreas", f));
      await saveOrgProfile(profileData);

      // 2. Add selected built-in sources
      const sourcesToAdd = BUILTIN_SOURCES.filter((s) => selectedSources.includes(s.id));
      for (const src of sourcesToAdd) {
        const fd = new FormData();
        fd.set("name", src.name);
        fd.set("url", src.url);
        fd.set("strategy", "AUTO");
        await addSource(fd);
      }

      // 3. Add custom URL if provided
      if (customUrl.trim()) {
        const fd = new FormData();
        fd.set("name", "Custom source");
        fd.set("url", customUrl.trim());
        fd.set("strategy", "AUTO");
        const result = await addSource(fd);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
      }

      // 4. Redirect to opportunities — scanning will be auto-triggered there
      router.push("/opportunities?scanning=1");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // ── Step 1 UI ──────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            We'll use this to find grants that match{" "}
            <span className="font-medium text-slate-700">{workspaceName}</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FOCUS_OPTIONS.map(({ value, icon: Icon, color }) => {
            const active = focus.includes(value);
            const classes = active
              ? `border-2 ring-2 ring-offset-1 ${COLOR_MAP[color]}`
              : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50";
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleFocus(value)}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-5 text-sm font-medium transition-all ${classes}`}
              >
                {active && (
                  <CheckCircle2
                    size={14}
                    className="absolute top-2 right-2 opacity-80"
                  />
                )}
                <Icon size={22} strokeWidth={1.5} />
                <span className="text-center leading-tight">{value}</span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push("/opportunities")}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip setup
          </button>
          <button
            type="button"
            disabled={focus.length === 0}
            onClick={() => setStep(2)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2 UI ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-slate-500 text-sm">
          SpotCast will scan these sites and score every opportunity for your profile.
        </p>
      </div>

      <div className="space-y-3">
        {BUILTIN_SOURCES.map((src) => {
          const checked = selectedSources.includes(src.id);
          return (
            <button
              key={src.id}
              type="button"
              onClick={() =>
                setSelectedSources((prev) =>
                  checked ? prev.filter((id) => id !== src.id) : [...prev, src.id]
                )
              }
              className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all ${
                checked
                  ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-300"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                checked ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
              }`}>
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-700">{src.name}</p>
                  {src.recommended && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 uppercase tracking-wide">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{src.description}</p>
              </div>
            </button>
          );
        })}

        {/* Custom URL */}
        <div className="rounded-xl border border-dashed border-slate-200 px-4 py-3.5">
          <p className="text-sm font-medium text-slate-600 mb-2">Add your own source (optional)</p>
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://example.org/grants"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back
        </button>
        <button
          type="button"
          disabled={selectedSources.length === 0 || loading}
          onClick={handleStart}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Setting up…
            </>
          ) : (
            <>
              Start scanning
              <ArrowRight size={15} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
