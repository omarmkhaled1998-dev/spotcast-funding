"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Target, ExternalLink, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, Filter, X, Clock, Zap,
  Trophy, Users, Presentation, Handshake, Star,
  TrendingUp, Globe, CheckCircle2,
} from "lucide-react";
import { formatDate, daysUntil, formatCurrency, parseJsonArray } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RadarOpportunity = {
  id: string;
  title: string;
  sourceUrl: string | null;
  deadlineDate: string | null;
  thematicAreas: string;
  geography: string;
  summary: string | null;
  typeOfCall: string | null;
  fundingAmountMin: number | null;
  fundingAmountMax: number | null;
  currency: string;
  urgencyLevel: string;
  donorName: string | null;
  personalScore: number;
  fitLabel: "strong" | "good" | "possible" | "weak";
  whyMatch: string;
  matchedKeywords: string[];
  matchedPriorities: string[];
};

type StatusValue = "bookmarked" | "in_progress" | "submitted" | "won" | "rejected" | null;
type SortKey = "score" | "deadline" | "amount" | "recent";
type FilterDeadline = "7" | "30" | "90" | "180" | "all";

// ─── Constants ────────────────────────────────────────────────────────────────

const FIT_CONFIG = {
  strong:   { label: "Strong Match",   bg: "bg-emerald-100",  text: "text-emerald-700", bar: "bg-emerald-500" },
  good:     { label: "Good Match",     bg: "bg-blue-100",     text: "text-blue-700",    bar: "bg-blue-500" },
  possible: { label: "Possible Match", bg: "bg-amber-100",    text: "text-amber-700",   bar: "bg-amber-500" },
  weak:     { label: "Weak Match",     bg: "bg-slate-100",    text: "text-slate-500",   bar: "bg-slate-400" },
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  OPEN:          { label: "Grant",       icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  RFA:           { label: "Grant",       icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  RFP:           { label: "Grant",       icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  EOI:           { label: "Grant",       icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  CONCEPT_NOTE:  { label: "Grant",       icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  INVITED:       { label: "Invitation",  icon: Star,         color: "bg-yellow-100 text-yellow-700" },
  OTHER:         { label: "Other",       icon: Globe,        color: "bg-slate-100 text-slate-600" },
  // For9a category names
  Fellowships:   { label: "Fellowship",  icon: Users,        color: "bg-indigo-100 text-indigo-700" },
  Grants:        { label: "Grant",       icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  "Trainings-or-Workshops": { label: "Training", icon: Presentation, color: "bg-cyan-100 text-cyan-700" },
  "Competitions-and-Awards": { label: "Award",   icon: Trophy,       color: "bg-amber-100 text-amber-700" },
  "Residencies-and-Exchange-Programs": { label: "Residency", icon: Globe, color: "bg-teal-100 text-teal-700" },
  // EJN types
  Workshops:     { label: "Workshop",    icon: Presentation, color: "bg-cyan-100 text-cyan-700" },
  "Story grants":{ label: "Story Grant", icon: Handshake,    color: "bg-violet-100 text-violet-700" },
  "Biodiversity Story Grants 2026": { label: "Grant", icon: Handshake, color: "bg-violet-100 text-violet-700" },
};

function getTypeConfig(typeOfCall: string | null) {
  if (!typeOfCall) return TYPE_CONFIG.OTHER;
  return TYPE_CONFIG[typeOfCall] ?? {
    label: typeOfCall.replace(/-/g, " ").replace(/([A-Z])/g, " $1").trim().split(/\s+/).slice(0, 2).join(" "),
    icon: Globe,
    color: "bg-slate-100 text-slate-600",
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  bookmarked:   { label: "Bookmarked",  color: "bg-amber-50 text-amber-700 border-amber-200",  icon: BookmarkCheck },
  in_progress:  { label: "In Progress", color: "bg-blue-50 text-blue-700 border-blue-200",     icon: Zap },
  submitted:    { label: "Submitted",   color: "bg-violet-50 text-violet-700 border-violet-200", icon: CheckCircle2 },
  won:          { label: "Won 🎉",       color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Trophy },
  rejected:     { label: "Rejected",    color: "bg-red-50 text-red-700 border-red-200",        icon: X },
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "radar-status";

function loadStatuses(): Record<string, StatusValue> {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch { return {}; }
}

function saveStatuses(map: Record<string, StatusValue>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(map));
}

// ─── Components ───────────────────────────────────────────────────────────────

function DeadlineBadge({ date }: { date: string | null }) {
  const days = daysUntil(date);
  if (days === null) return <span className="text-xs text-slate-400">No deadline</span>;
  if (days < 0) return <span className="text-xs text-slate-400 line-through">Expired</span>;
  const color = days <= 7 ? "bg-red-100 text-red-700" : days <= 30 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${color}`} suppressHydrationWarning>
      <Clock size={11} />
      {days === 0 ? "Today" : days === 1 ? "1 day" : `${days}d`} left
    </span>
  );
}

function ScoreBar({ score, label }: { score: number; label: "strong" | "good" | "possible" | "weak" }) {
  const cfg = FIT_CONFIG[label];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-slate-600 tabular-nums">{score}</span>
    </div>
  );
}

function WhyMatch({ text, keywords, priorities }: { text: string; keywords: string[]; priorities: string[] }) {
  const [open, setOpen] = useState(false);
  // Render **bold** markdown-style highlights
  const rendered = text.split(/\*\*(.*?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-slate-800">{part}</strong> : part
  );
  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        <Zap size={11} />
        Why this matches you
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      {open && (
        <div className="mt-1.5 text-xs text-slate-600 bg-indigo-50 rounded-lg px-3 py-2 leading-relaxed space-y-1.5">
          <p>{rendered}</p>
          {priorities.length > 0 && (
            <p className="flex flex-wrap gap-1">
              <span className="font-medium text-slate-700">Priorities:</span>
              {priorities.map((p) => (
                <span key={p} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">{p}</span>
              ))}
            </p>
          )}
          {keywords.length > 0 && (
            <p className="flex flex-wrap gap-1">
              <span className="font-medium text-slate-700">Keywords:</span>
              {keywords.slice(0, 6).map((k) => (
                <span key={k} className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{k}</span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusMenu({ id, current, onChange }: { id: string; current: StatusValue; onChange: (v: StatusValue) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium transition-colors ${
          current && STATUS_CONFIG[current]
            ? STATUS_CONFIG[current].color
            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
        }`}
      >
        {current ? STATUS_CONFIG[current].label : "Set status"}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
          {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((key) => {
            const cfg = STATUS_CONFIG[key];
            const Icon = cfg.icon as React.ComponentType<{ size?: number }>;
            return (
              <button key={key} onClick={() => { onChange(key as StatusValue); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700"
              >
                <Icon size={11} /> {cfg.label}
              </button>
            );
          })}
          {current && (
            <button onClick={() => { onChange(null); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-400 border-t border-slate-100"
            >
              <X size={11} /> Clear status
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OpportunityCard({ opp, status, onStatusChange }: {
  opp: RadarOpportunity;
  status: StatusValue;
  onStatusChange: (v: StatusValue) => void;
}) {
  const fit = FIT_CONFIG[opp.fitLabel];
  const typeConf = getTypeConfig(opp.typeOfCall);
  const TypeIcon = typeConf.icon as React.ComponentType<{ size?: number }>;
  const geo = parseJsonArray(opp.geography);
  const themes = parseJsonArray(opp.thematicAreas);
  const hasFunding = opp.fundingAmountMin || opp.fundingAmountMax;

  return (
    <div className={`bg-white rounded-xl border transition-all hover:shadow-md ${
      opp.fitLabel === "strong" ? "border-emerald-200" :
      opp.fitLabel === "good" ? "border-blue-200" :
      "border-slate-200"
    }`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${typeConf.color}`}>
              <TypeIcon size={10} /> {typeConf.label}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${fit.bg} ${fit.text}`}>
              {fit.label}
            </span>
            <DeadlineBadge date={opp.deadlineDate} />
          </div>
          <StatusMenu id={opp.id} current={status} onChange={onStatusChange} />
        </div>

        {/* Title */}
        <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-1">
          {opp.title}
        </h3>

        {/* Funder + amount */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mb-2">
          {opp.donorName && <span className="font-medium text-slate-600">{opp.donorName}</span>}
          {hasFunding && (
            <span className="text-slate-500">
              {opp.fundingAmountMin && opp.fundingAmountMax
                ? `${formatCurrency(opp.fundingAmountMin, opp.currency)} – ${formatCurrency(opp.fundingAmountMax, opp.currency)}`
                : opp.fundingAmountMax
                  ? `Up to ${formatCurrency(opp.fundingAmountMax, opp.currency)}`
                  : formatCurrency(opp.fundingAmountMin, opp.currency)}
            </span>
          )}
          {opp.deadlineDate && (
            <span>Deadline: {formatDate(opp.deadlineDate)}</span>
          )}
        </div>

        {/* Summary */}
        {opp.summary && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
            {opp.summary}
          </p>
        )}

        {/* Score bar */}
        <div className="mb-2">
          <ScoreBar score={opp.personalScore} label={opp.fitLabel} />
        </div>

        {/* Why match */}
        <WhyMatch text={opp.whyMatch} keywords={opp.matchedKeywords} priorities={opp.matchedPriorities} />

        {/* Tags */}
        {(geo.length > 0 || themes.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {geo.slice(0, 2).map((g) => (
              <span key={g} className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full">{g}</span>
            ))}
            {themes.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full">{t}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <Link href={`/opportunities/${opp.id}`} className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">
            View in pipeline →
          </Link>
          {opp.sourceUrl && (
            <a href={opp.sourceUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              Apply / Register <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats header ─────────────────────────────────────────────────────────────

function StatsHeader({ opps, statuses }: { opps: RadarOpportunity[]; statuses: Record<string, StatusValue> }) {
  const total = opps.length;
  const soon = opps.filter((o) => { const d = daysUntil(o.deadlineDate); return d !== null && d >= 0 && d <= 30; }).length;
  const strong = opps.filter((o) => o.fitLabel === "strong").length;
  const bookmarked = Object.values(statuses).filter((v) => v === "bookmarked").length;
  const inProgress = Object.values(statuses).filter((v) => v === "in_progress").length;

  const stats = [
    { label: "Total Matches",    value: total,      color: "text-slate-800", icon: Target },
    { label: "Strong Fits",       value: strong,     color: "text-emerald-600", icon: Star },
    { label: "Deadline ≤30 days", value: soon,       color: "text-amber-600",   icon: Clock },
    { label: "Bookmarked",        value: bookmarked, color: "text-indigo-600",  icon: BookmarkCheck },
    { label: "In Progress",       value: inProgress, color: "text-blue-600",    icon: TrendingUp },
  ];

  return (
    <div className="flex flex-wrap gap-6 px-6 py-4 bg-white border-b border-slate-200">
      {stats.map(({ label, value, color, icon: Icon }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={14} className={color} />
          <div>
            <div className={`text-lg font-bold leading-none ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-400">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filters panel ────────────────────────────────────────────────────────────

const FIT_LABELS = ["strong", "good", "possible", "weak"] as const;
const ALL_TYPES = ["Grant", "Fellowship", "Award", "Workshop", "Training", "Residency", "Competition", "Other"];
const DEADLINE_OPTIONS: { label: string; value: FilterDeadline }[] = [
  { label: "All", value: "all" },
  { label: "Next 7 days", value: "7" },
  { label: "Next 30 days", value: "30" },
  { label: "Next 90 days", value: "90" },
  { label: "Next 6 months", value: "180" },
];
const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Best match", value: "score" },
  { label: "Deadline (soonest)", value: "deadline" },
  { label: "Amount (highest)", value: "amount" },
  { label: "Recently added", value: "recent" },
];

function getTypeLabel(typeOfCall: string | null): string {
  return getTypeConfig(typeOfCall).label;
}

// ─── Main client component ────────────────────────────────────────────────────

export function RadarClient({
  opportunities,
  userName = "You",
  hasProfile = true,
}: {
  opportunities: RadarOpportunity[];
  userName?: string;
  hasProfile?: boolean;
}) {
  const [statuses, setStatuses] = useState<Record<string, StatusValue>>({});
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [deadlineFilter, setDeadlineFilter] = useState<FilterDeadline>("all");
  const [fitFilter, setFitFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // Load statuses from localStorage after hydration
  useEffect(() => {
    setStatuses(loadStatuses());
  }, []);

  function updateStatus(id: string, value: StatusValue) {
    setStatuses((prev) => {
      const next = { ...prev };
      if (value === null) delete next[id];
      else next[id] = value;
      saveStatuses(next);
      return next;
    });
  }

  // ── Filter + sort ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...opportunities];

    // Search
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((o) =>
        o.title.toLowerCase().includes(q) ||
        (o.donorName || "").toLowerCase().includes(q) ||
        o.matchedKeywords.some((k) => k.includes(q))
      );
    }

    // Fit filter
    if (fitFilter.size > 0) {
      list = list.filter((o) => fitFilter.has(o.fitLabel));
    }

    // Type filter
    if (typeFilter.size > 0) {
      list = list.filter((o) => typeFilter.has(getTypeLabel(o.typeOfCall)));
    }

    // Deadline window
    if (deadlineFilter !== "all") {
      const days = parseInt(deadlineFilter);
      list = list.filter((o) => {
        const d = daysUntil(o.deadlineDate);
        if (d === null) return true; // no deadline = always show
        return d >= 0 && d <= days;
      });
    }

    // Bookmarked only
    if (onlyBookmarked) {
      list = list.filter((o) => statuses[o.id] === "bookmarked");
    }

    // Sort
    list.sort((a, b) => {
      if (sortKey === "score") return b.personalScore - a.personalScore;
      if (sortKey === "deadline") {
        const da = daysUntil(a.deadlineDate) ?? 9999;
        const db = daysUntil(b.deadlineDate) ?? 9999;
        return da - db;
      }
      if (sortKey === "amount") {
        return (b.fundingAmountMax ?? 0) - (a.fundingAmountMax ?? 0);
      }
      // recent: keep original order (already sorted by foundAt desc)
      return 0;
    });

    return list;
  }, [opportunities, searchQ, fitFilter, typeFilter, deadlineFilter, onlyBookmarked, statuses, sortKey]);

  function toggleFit(v: string) {
    setFitFilter((prev) => {
      const n = new Set(prev);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  }
  function toggleType(v: string) {
    setTypeFilter((prev) => {
      const n = new Set(prev);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  }

  const activeFilterCount =
    fitFilter.size + typeFilter.size +
    (deadlineFilter !== "all" ? 1 : 0) +
    (onlyBookmarked ? 1 : 0);

  return (
    <div className="flex flex-col h-full">
      {/* ── Profile setup banner ─────────────────────────────────────── */}
      {!hasProfile && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 shrink-0 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Set up your profile</span> — scores are approximate until you add your keywords and interests.
          </p>
          <Link
            href="/onboarding"
            className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
          >
            Set up profile
          </Link>
        </div>
      )}

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Target size={16} className="text-indigo-600" />
              <h1 className="text-base font-semibold text-slate-800">Personal Radar</h1>
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">{userName}</span>
            </div>
            <p className="text-xs text-slate-500">
              All opportunities scored for your personal profile — fellowships, awards, grants & conferences
            </p>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              placeholder="Search…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <StatsHeader opps={opportunities} statuses={statuses} />

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 flex-wrap">
        {/* Sort */}
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Deadline */}
        <select
          value={deadlineFilter}
          onChange={(e) => setDeadlineFilter(e.target.value as FilterDeadline)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          {DEADLINE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            activeFilterCount > 0 || filtersOpen
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Filter size={12} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-indigo-600 rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Bookmarked toggle */}
        <button
          onClick={() => setOnlyBookmarked((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            onlyBookmarked
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Bookmark size={12} />
          Bookmarked
        </button>

        <span className="ml-auto text-xs text-slate-400">{filtered.length} opportunities</span>
      </div>

      {/* ── Filter panel (collapsible) ───────────────────────────────── */}
      {filtersOpen && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap gap-6 shrink-0">
          {/* Match quality */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Match quality</p>
            <div className="flex flex-wrap gap-1.5">
              {FIT_LABELS.map((f) => {
                const cfg = FIT_CONFIG[f];
                const active = fitFilter.has(f);
                return (
                  <button key={f} onClick={() => toggleFit(f)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                      active ? `${cfg.bg} ${cfg.text} border-transparent` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Type */}
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TYPES.map((t) => {
                const active = typeFilter.has(t);
                return (
                  <button key={t} onClick={() => toggleType(t)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                      active ? "bg-indigo-100 text-indigo-700 border-transparent" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setFitFilter(new Set()); setTypeFilter(new Set()); setDeadlineFilter("all"); setOnlyBookmarked(false); }}
              className="self-end text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <X size={11} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* ── Feed ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Target size={40} className="text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No opportunities match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try widening the deadline window or clearing filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opp={opp}
                status={statuses[opp.id] ?? null}
                onStatusChange={(v) => updateStatus(opp.id, v)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
