"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Trash2, Power, Globe, AlertTriangle, CheckCircle2,
  Clock, RefreshCw, Zap, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSource, toggleSource, deleteSource, updateSourceStrategy } from "@/lib/actions/sources";
import type { ScrapeStrategy } from "@/app/generated/prisma/client";

interface SourceRow {
  id: string;
  name: string;
  url: string;
  strategy: ScrapeStrategy;
  isActive: boolean;
  lastScrapedAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

interface LastIngest {
  status: string;
  startedAt: string | null;
  imported: number;
}

interface Props {
  sources: SourceRow[];
  lastIngest: LastIngest | null;
}

const STRATEGY_LABELS: Record<ScrapeStrategy, string> = {
  AUTO: "Auto-detect",
  HTTP: "HTTP (fast)",
  PLAYWRIGHT: "Playwright (JS)",
  APPLESCRIPT: "AppleScript (macOS)",
};

const BUILT_IN_SOURCES = [
  { name: "Daleel Madani", url: "https://daleel-madani.org/calls-for-proposal" },
  { name: "Earth Journalism Network", url: "https://earthjournalism.net/opportunities" },
  { name: "For9a", url: "https://www.for9a.com/en" },
];

export function SourcesClient({ sources, lastIngest }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [scraping, setScraping] = useState(false);
  const [scrapeLog, setScrapeLog] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionError, setActionError] = useState("");
  const [expandedLog, setExpandedLog] = useState(false);

  // ── Add source ──────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await addSource(form);
      if (result.error) {
        setAddError(result.error);
      } else {
        setShowAddForm(false);
        router.refresh();
      }
    });
  }

  // ── Toggle / delete ─────────────────────────────────────────────────────────
  async function handleToggle(id: string) {
    setActionError("");
    startTransition(async () => {
      const result = await toggleSource(id);
      if (result.error) setActionError(result.error);
      else router.refresh();
    });
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove source "${name}"? This won't delete existing opportunities.`)) return;
    setActionError("");
    startTransition(async () => {
      const result = await deleteSource(id);
      if (result.error) setActionError(result.error);
      else router.refresh();
    });
  }

  async function handleStrategyChange(id: string, strategy: ScrapeStrategy) {
    startTransition(async () => {
      await updateSourceStrategy(id, strategy);
      router.refresh();
    });
  }

  // ── Trigger manual scrape ───────────────────────────────────────────────────
  async function handleScrapeNow() {
    setScraping(true);
    setScrapeLog([]);
    setExpandedLog(true);

    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const { msg } = JSON.parse(line.slice(6));
              if (msg) setScrapeLog((prev) => [...prev, msg]);
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setScrapeLog((prev) => [...prev, `Error: ${(err as Error).message}`]);
    } finally {
      setScraping(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Last ingest banner */}
      {lastIngest && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          {lastIngest.status === "COMPLETED" ? (
            <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
          ) : lastIngest.status === "RUNNING" ? (
            <RefreshCw size={15} className="text-blue-500 animate-spin flex-shrink-0" />
          ) : (
            <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
          )}
          <span className="text-slate-600">
            Last scrape:{" "}
            <span className="font-medium">
              {lastIngest.startedAt
                ? new Date(lastIngest.startedAt).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })
                : "—"}
            </span>
            {" · "}
            {lastIngest.imported} opportunities imported
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrapeNow}
            isLoading={scraping}
            className="ml-auto flex items-center gap-1.5"
          >
            <Zap size={13} />
            {scraping ? "Scraping…" : "Run now"}
          </Button>
        </div>
      )}

      {!lastIngest && (
        <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 px-4 py-3">
          <p className="text-sm text-slate-500">No scrapes run yet.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrapeNow}
            isLoading={scraping}
            className="flex items-center gap-1.5"
          >
            <Zap size={13} />
            {scraping ? "Scraping…" : "Run first scrape"}
          </Button>
        </div>
      )}

      {/* Live scrape log */}
      {scrapeLog.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-900 overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2 cursor-pointer select-none"
            onClick={() => setExpandedLog((v) => !v)}
          >
            <span className="text-xs font-mono text-slate-400">Scrape log</span>
            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform ${expandedLog ? "rotate-180" : ""}`}
            />
          </div>
          {expandedLog && (
            <div className="px-4 pb-4 max-h-60 overflow-y-auto space-y-0.5">
              {scrapeLog.map((line, i) => (
                <p key={i} className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {line}
                </p>
              ))}
              {scraping && (
                <p className="text-xs font-mono text-indigo-400 animate-pulse">▋</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Source list */}
      <div className="space-y-3">
        {sources.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center">
            <Globe size={28} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-medium text-slate-600">No sources yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add a source URL or pick from our curated list below
            </p>
          </div>
        )}

        {sources.map((source) => (
          <SourceCard
            key={source.id}
            source={source}
            onToggle={() => handleToggle(source.id)}
            onDelete={() => handleDelete(source.id, source.name)}
            onStrategyChange={(s) => handleStrategyChange(source.id, s)}
            pending={isPending}
          />
        ))}
      </div>

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{actionError}</p>
      )}

      {/* Add source form */}
      {showAddForm ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Add custom source</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <Input
              label="Source name"
              name="name"
              type="text"
              required
              placeholder="e.g. UNDP Arab States"
            />
            <Input
              label="URL"
              name="url"
              type="url"
              required
              placeholder="https://example.org/grants"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Scraping strategy
              </label>
              <select
                name="strategy"
                defaultValue="AUTO"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="AUTO">Auto-detect (recommended)</option>
                <option value="HTTP">HTTP only (fast, no JS)</option>
                <option value="PLAYWRIGHT">Playwright (handles JS-rendered pages)</option>
              </select>
            </div>

            {addError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{addError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="submit" size="sm" isLoading={isPending}>
                Add source
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setShowAddForm(false); setAddError(""); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={14} />
          Add custom source
        </Button>
      )}

      {/* Built-in source suggestions (only show ones not already added) */}
      {(() => {
        const addedUrls = new Set(sources.map((s) => s.url));
        const suggestions = BUILT_IN_SOURCES.filter((b) => !addedUrls.has(b.url));
        if (suggestions.length === 0) return null;

        return (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Suggested sources
            </p>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.url}
                  name={s.name}
                  url={s.url}
                  onAdd={async () => {
                    const form = new FormData();
                    form.set("name", s.name);
                    form.set("url", s.url);
                    form.set("strategy", "AUTO");
                    startTransition(async () => {
                      await addSource(form);
                      router.refresh();
                    });
                  }}
                  pending={isPending}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SourceCard({
  source,
  onToggle,
  onDelete,
  onStrategyChange,
  pending,
}: {
  source: SourceRow;
  onToggle: () => void;
  onDelete: () => void;
  onStrategyChange: (s: ScrapeStrategy) => void;
  pending: boolean;
}) {
  const hasError = !!source.lastError;
  const lastSeen = source.lastSuccessAt ?? source.lastScrapedAt;

  return (
    <div
      className={`rounded-xl border px-4 py-3.5 transition-colors ${
        source.isActive
          ? hasError
            ? "border-amber-200 bg-amber-50/40"
            : "border-slate-200 bg-white"
          : "border-slate-100 bg-slate-50 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{source.name}</p>
            {source.isActive ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Paused
              </span>
            )}
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-indigo-500 transition-colors truncate block"
          >
            {source.url}
          </a>
          <div className="flex items-center gap-3 mt-1.5">
            {/* Strategy selector */}
            <select
              value={source.strategy}
              onChange={(e) => onStrategyChange(e.target.value as ScrapeStrategy)}
              className="text-[11px] text-slate-500 bg-transparent border-none focus:outline-none cursor-pointer hover:text-slate-700"
            >
              {(Object.keys(STRATEGY_LABELS) as ScrapeStrategy[]).map((k) => (
                <option key={k} value={k}>{STRATEGY_LABELS[k]}</option>
              ))}
            </select>
            {lastSeen && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock size={10} />
                {new Date(lastSeen).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                })}
              </span>
            )}
          </div>
          {hasError && (
            <p className="mt-1.5 text-xs text-amber-700 flex items-start gap-1">
              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />
              {source.lastError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            disabled={pending}
            title={source.isActive ? "Pause source" : "Activate source"}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50"
          >
            <Power size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={pending}
            title="Remove source"
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SuggestionCard({
  name,
  url,
  onAdd,
  pending,
}: {
  name: string;
  url: string;
  onAdd: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors">
      <div>
        <p className="text-sm font-medium text-slate-700">{name}</p>
        <p className="text-xs text-slate-400 truncate max-w-xs">{url}</p>
      </div>
      <button
        onClick={onAdd}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors disabled:opacity-50"
      >
        <Plus size={12} />
        Add
      </button>
    </div>
  );
}
