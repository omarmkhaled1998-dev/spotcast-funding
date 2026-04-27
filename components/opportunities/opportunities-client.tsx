"use client";
import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { OpportunityForm } from "./opportunity-form";
import { createOpportunity } from "@/lib/actions/opportunities";
import {
  formatDate,
  daysUntil,
  formatCurrency,
  parseJsonArray,
  FIT_COLORS,
  FIT_LABELS,
  STATUS_LABELS,
} from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Plus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Inbox,
  Loader2,
  CheckCircle2,
  X,
  RefreshCw,
} from "lucide-react";
import type { Opportunity, Donor, Decision } from "@/app/generated/prisma/client";

type OppWithRelations = Opportunity & { donor: Donor | null; decision: Decision | null };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "NEEDS_REVIEW", label: "New" },
  { value: "UNDER_EVALUATION", label: "Reviewing" },
  { value: "GO", label: "Pursuing" },
  { value: "HOLD", label: "On hold" },
  { value: "NO_GO", label: "Declined" },
  { value: "ARCHIVED", label: "Archived" },
];

const FIT_OPTIONS = [
  { value: "", label: "All fit labels" },
  { value: "SUITABLE", label: "Strong match" },
  { value: "MAYBE", label: "Worth reviewing" },
  { value: "NOT_SUITABLE", label: "Not a fit" },
];

interface Filters { status: string; fit: string; q: string }

export function OpportunitiesClient({
  opportunities,
  donors,
  total,
  page,
  pageSize,
  filters,
  scanning: initialScanning = false,
  showDemoBanner = false,
}: {
  opportunities: OppWithRelations[];
  donors: { id: string; name: string }[];
  total: number;
  page: number;
  pageSize: number;
  filters: Filters;
  scanning?: boolean;
  showDemoBanner?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();
  const [searchDraft, setSearchDraft] = useState(filters.q);

  // ── Scanning banner state ──────────────────────────────────────────────────
  const [scanActive, setScanActive] = useState(initialScanning);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [scanDone, setScanDone] = useState(false);
  const [scanImported, setScanImported] = useState(0);
  const scanStarted = useRef(false);

  async function runScan() {
    setScanActive(true);
    setScanDone(false);
    setScanLog([]);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { msg } = JSON.parse(line.slice(6));
            if (!msg) continue;
            if (msg.startsWith("__DONE__:")) {
              const stats = JSON.parse(msg.slice(9));
              setScanImported(stats.imported ?? 0);
              setScanDone(true);
              router.replace("/opportunities");
              router.refresh();
            } else {
              setScanLog((prev) => [...prev.slice(-6), msg]);
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setScanDone(true);
    }
  }

  useEffect(() => {
    if (!initialScanning || scanStarted.current) return;
    scanStarted.current = true;
    runScan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialScanning]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Build URL with updated params, resetting page to 1 when filters change
  const buildUrl = useCallback(
    (updates: Partial<Filters & { page: number }>) => {
      const p = new URLSearchParams();
      const merged = { ...filters, page, ...updates };
      if (merged.q) p.set("q", merged.q);
      if (merged.status) p.set("status", merged.status);
      if (merged.fit) p.set("fit", merged.fit);
      if (merged.page > 1) p.set("page", String(merged.page));
      const qs = p.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [filters, page, pathname]
  );

  function handleFilterChange(key: keyof Filters, value: string) {
    router.push(buildUrl({ [key]: value, page: 1 }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    handleFilterChange("q", searchDraft);
  }

  async function handleCreate(data: FormData) {
    startTransition(async () => {
      await createOpportunity(data);
      setShowForm(false);
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scanning banner */}
      {scanActive && (
        <div className={`flex items-start gap-3 px-5 py-3 text-sm border-b ${
          scanDone
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-indigo-50 border-indigo-200 text-indigo-800"
        }`}>
          {scanDone ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
          ) : (
            <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin text-indigo-600" />
          )}
          <div className="flex-1 min-w-0">
            {scanDone ? (
              <p className="font-medium">
                Scan complete — found {scanImported} new {scanImported === 1 ? "opportunity" : "opportunities"}.
                {scanImported === 0 && " Try adding more sources in Settings."}
              </p>
            ) : (
              <>
                <p className="font-medium">Scanning your sources for opportunities…</p>
                {scanLog.length > 0 && (
                  <p className="text-xs mt-0.5 opacity-70 truncate">{scanLog[scanLog.length - 1]}</p>
                )}
              </>
            )}
          </div>
          {scanDone && (
            <button onClick={() => setScanActive(false)} className="shrink-0 opacity-50 hover:opacity-80">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* Demo content banner */}
      {showDemoBanner && (
        <div className="flex items-center gap-3 px-5 py-2.5 text-sm bg-amber-50 border-b border-amber-200 text-amber-800">
          <span className="text-base">✨</span>
          <p>
            <span className="font-medium">These are sample opportunities</span> — showing you what SpotCast looks like with real data.{" "}
            <Link href="/settings/sources" className="underline font-medium hover:text-amber-900">
              Add a source to scan for real grants →
            </Link>
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Opportunities</h1>
          <p className="text-xs text-slate-500">
            {total === 0
              ? "No opportunities"
              : total === 1
              ? "1 opportunity"
              : `${start}–${end} of ${total}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/opportunities${filters.status || filters.fit || filters.q ? `?${new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v))).toString()}` : ""}`}
            download
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            title="Export to CSV"
          >
            <Download size={13} />
            Export
          </a>
          <button
            onClick={runScan}
            disabled={scanActive && !scanDone}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {scanActive && !scanDone ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <RefreshCw size={13} />
            )}
            {scanActive && !scanDone ? "Scanning…" : "Scan now"}
          </button>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus size={14} /> Add Opportunity
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white flex-wrap">
        <form onSubmit={handleSearch} className="flex items-center gap-1.5">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none w-48"
            />
          </div>
          <button type="submit" className="sr-only">Search</button>
        </form>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters.fit}
          onChange={(e) => handleFilterChange("fit", e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
        >
          {FIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(filters.q || filters.status || filters.fit) && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {opportunities.length === 0 ? (
          total === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No opportunities yet"
              description="Add your first funding opportunity manually or run a scrape to pull them in automatically."
              action={{ label: "Add Opportunity", onClick: () => setShowForm(true) }}
              secondaryAction={{ label: "Go to Sources", href: "/settings/sources" }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No results"
              description="No opportunities match your current filters. Try adjusting or clearing them."
              action={{ label: "Clear filters", onClick: () => router.push(pathname) }}
            />
          )
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Title</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Donor</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Deadline</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Score</th>
                <th className="text-left py-2 pr-4 font-medium text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-2 font-medium text-slate-500 text-xs uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => {
                const days = daysUntil(opp.deadlineDate);
                const urgencyKey =
                  days === null
                    ? "low"
                    : days <= 3
                    ? "critical"
                    : days <= 7
                    ? "high"
                    : "low";

                return (
                  <tr key={opp.id} className="hover:bg-slate-50 cursor-pointer group">
                    <td className="py-3 pr-4">
                      <Link href={`/opportunities/${opp.id}`} className="block">
                        <p className="font-medium text-slate-800 group-hover:text-indigo-700 leading-tight">
                          {opp.title}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {parseJsonArray(opp.thematicAreas).slice(0, 2).map((t) => (
                            <span key={t} className="text-xs text-slate-400">{t}</span>
                          ))}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {opp.donor ? (
                        <Link href={`/donors/${opp.donorId}`} className="hover:text-indigo-600">
                          {opp.donor.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {opp.deadlineDate ? (
                        <div className="flex items-center gap-1.5">
                          {days !== null && days <= 7 && (
                            <AlertTriangle
                              size={13}
                              className={urgencyKey === "critical" ? "text-red-500" : "text-orange-400"}
                            />
                          )}
                          <span
                            className={
                              days !== null && days <= 3
                                ? "text-red-600 font-medium"
                                : days !== null && days <= 7
                                ? "text-orange-600"
                                : "text-slate-600"
                            }
                          >
                            {formatDate(opp.deadlineDate)}
                          </span>
                          {days !== null && (
                            <span className="text-xs text-slate-400" suppressHydrationWarning>
                              ({days <= 0 ? "overdue" : `${days}d`})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {opp.fitLabel ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{opp.suitabilityScore}</span>
                          <Badge className={FIT_COLORS[opp.fitLabel]} variant="outline">
                            {FIT_LABELS[opp.fitLabel] ?? opp.fitLabel.replace("_", " ")}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Not scored</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={opp.status} />
                    </td>
                    <td className="py-3 text-slate-600">
                      {opp.fundingAmountMax ? (
                        formatCurrency(opp.fundingAmountMax, opp.currency)
                      ) : opp.fundingAmountMin ? (
                        formatCurrency(opp.fundingAmountMin, opp.currency)
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-slate-100 bg-white px-6 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {start}–{end} of {total} opportunities
          </p>
          <div className="flex items-center gap-1">
            <Link
              href={buildUrl({ page: page - 1 })}
              aria-disabled={page <= 1}
              className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm border transition-colors ${
                page <= 1
                  ? "border-slate-100 text-slate-300 pointer-events-none"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <ChevronLeft size={14} />
            </Link>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current
              let p: number;
              if (totalPages <= 5) {
                p = i + 1;
              } else if (page <= 3) {
                p = i + 1;
              } else if (page >= totalPages - 2) {
                p = totalPages - 4 + i;
              } else {
                p = page - 2 + i;
              }
              return (
                <Link
                  key={p}
                  href={buildUrl({ page: p })}
                  className={`inline-flex items-center justify-center rounded-md w-8 h-8 text-sm border transition-colors ${
                    p === page
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            <Link
              href={buildUrl({ page: page + 1 })}
              aria-disabled={page >= totalPages}
              className={`inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-sm border transition-colors ${
                page >= totalPages
                  ? "border-slate-100 text-slate-300 pointer-events-none"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Opportunity" size="lg">
        <OpportunityForm donors={donors} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEEDS_REVIEW: "bg-amber-100 text-amber-700",
    UNDER_EVALUATION: "bg-blue-100 text-blue-700",
    GO: "bg-green-100 text-green-700",
    HOLD: "bg-slate-100 text-slate-600",
    NO_GO: "bg-red-100 text-red-600",
    ARCHIVED: "bg-slate-100 text-slate-400",
  };
  return (
    <Badge className={colors[status] ?? "bg-slate-100 text-slate-600"}>
      {STATUS_LABELS[status] ?? status.replace("_", " ")}
    </Badge>
  );
}
