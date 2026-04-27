"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FIT_COLORS, formatDate, daysUntil } from "@/lib/utils";
import {
  Globe, RefreshCw, CheckCircle, XCircle, Clock,
  AlertTriangle, ExternalLink, Zap, Search, Info, Monitor,
} from "lucide-react";

type IngestLog = {
  id: string; source: string; startedAt: Date; completedAt: Date | null;
  status: string; pagesScraped: number; found: number; imported: number;
  skipped: number; errors: string | null;
};
type ImportedOpp = {
  id: string; title: string; sourceUrl: string | null; deadlineDate: Date | null;
  suitabilityScore: number | null; fitLabel: string | null; thematicAreas: string;
  geography: string; status: string; createdAt: Date;
  donor: { id: string; name: string } | null;
};

function getSourceLabel(url: string | null): { label: string; color: string } {
  if (!url) return { label: "Manual", color: "text-slate-400" };
  if (url.includes("daleel-madani.org")) return { label: "Daleel Madani", color: "text-violet-500" };
  if (url.includes("earthjournalism.net")) return { label: "EJN", color: "text-green-600" };
  if (url.includes("for9a.com")) return { label: "For9a", color: "text-blue-500" };
  return { label: "Web", color: "text-slate-400" };
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle size={14} className="text-green-500" />,
  RUNNING:   <RefreshCw size={14} className="text-blue-500 animate-spin" />,
  FAILED:    <XCircle size={14} className="text-red-500" />,
  PARTIAL:   <AlertTriangle size={14} className="text-amber-500" />,
};
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  RUNNING:   "bg-blue-50 text-blue-700 border-blue-200",
  FAILED:    "bg-red-50 text-red-700 border-red-200",
  PARTIAL:   "bg-amber-50 text-amber-700 border-amber-200",
};

export function DiscoverClient({
  ingestLogs, recentImports,
}: {
  ingestLogs: IngestLog[];
  recentImports: ImportedOpp[];
  cfCookieExists: boolean;       // kept for backwards compat with page.tsx prop
  cfCookieAgeHours: number | null;
}) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [filter, setFilter] = useState<"all" | "suitable" | "maybe">("all");
  const logBoxRef = useRef<HTMLDivElement>(null);

  const filtered = recentImports.filter((o) => {
    if (filter === "suitable") return o.fitLabel === "SUITABLE";
    if (filter === "maybe") return o.fitLabel === "MAYBE";
    return true;
  });
  const suitableCount = recentImports.filter((o) => o.fitLabel === "SUITABLE").length;
  const maybeCount    = recentImports.filter((o) => o.fitLabel === "MAYBE").length;

  async function runIngest() {
    setIsRunning(true);
    setLogs([]);
    setShowLogs(true);

    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      if (!res.ok || !res.body) { setLogs((p) => [...p, "❌ Failed to start"]); return; }

      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = dec.decode(value);
        for (const line of text.split("\n").filter((l) => l.startsWith("data:"))) {
          try {
            const { msg } = JSON.parse(line.replace("data:", "").trim());
            if (msg) {
              setLogs((p) => {
                const next = [...p, msg];
                setTimeout(() => logBoxRef.current?.scrollTo({ top: logBoxRef.current.scrollHeight }), 50);
                return next;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      setLogs((p) => [...p, `❌ ${(err as Error).message}`]);
    } finally {
      setIsRunning(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-indigo-600" />
              <h1 className="text-base font-semibold text-slate-800">Discover Opportunities</h1>
            </div>
            <p className="text-xs text-slate-500 max-w-xl">
              Scans 3 sources —{" "}
              <a href="https://daleel-madani.org/calls-for-proposal" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Daleel Madani</a>
              {", "}
              <a href="https://earthjournalism.net/opportunities" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Earth Journalism Network</a>
              {", and "}
              <a href="https://www.for9a.com/en/opportunity" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">For9a</a>
              {" — scores results against SpotCast\u2019s profile, and imports relevant ones."}
            </p>
          </div>
          <Button onClick={runIngest} disabled={isRunning} className="shrink-0">
            {isRunning
              ? <><RefreshCw size={14} className="animate-spin" /> Running…</>
              : <><Search size={14} /> Scan Now</>}
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "Total Imported", value: recentImports.length, color: "text-slate-800" },
            { label: "Suitable",       value: suitableCount,        color: "text-green-600" },
            { label: "Maybe",          value: maybeCount,           color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
          <div className="text-center">
            <div className="text-sm font-semibold text-green-600">● Chrome</div>
            <div className="text-xs text-slate-500">via AppleScript</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── One-time Chrome setup notice ─────────────────────── */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Monitor size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 mb-2">
                One-time Chrome setup required (30 seconds)
              </p>
              <ol className="text-xs text-amber-800 space-y-1 list-decimal ml-4">
                <li>Open <strong>Google Chrome</strong></li>
                <li>In the menu bar click <strong>View → Developer → Allow JavaScript from Apple Events</strong> (toggle it ON — a checkmark appears)</li>
                <li>Done! Scanning will now work automatically every time.</li>
              </ol>
              <p className="text-xs text-amber-700 mt-2">
                This allows the app to read page content from Chrome tabs. It does not give any other permissions.
              </p>
            </div>
          </div>
        </div>

        {/* ── Live log ─────────────────────────────────────────────── */}
        {showLogs && logs.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Zap size={12} className="text-indigo-400" /> Live Output
              </span>
              <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-slate-300 text-xs">Hide</button>
            </div>
            <div ref={logBoxRef} className="p-4 max-h-56 overflow-y-auto font-mono text-xs space-y-0.5">
              {logs.map((line, i) => (
                <div key={i} className={
                  line.startsWith("  ✓") ? "text-green-400" :
                  line.startsWith("  ✗") || line.startsWith("❌") ? "text-red-400" :
                  line.startsWith("✅") ? "text-green-300" :
                  line.startsWith("  Skip") ? "text-slate-500" :
                  "text-slate-300"
                }>{line}</div>
              ))}
            </div>
          </div>
        )}

        {/* ── Scan history ─────────────────────────────────────────── */}
        {ingestLogs.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Scan History</h2>
            <div className="space-y-1.5">
              {ingestLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
                  <div className="shrink-0">{STATUS_ICON[log.status] || <Clock size={14} className="text-slate-400" />}</div>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[log.status]}`}>{log.status}</span>
                    <span className="text-xs text-slate-500">{formatDate(log.startedAt)}</span>
                    {log.completedAt && (
                      <span className="text-xs text-slate-400">
                        · {Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs shrink-0">
                    <span className="text-slate-600"><span className="font-medium">{log.found}</span> found</span>
                    <span className="text-green-600"><span className="font-medium">{log.imported}</span> imported</span>
                    <span className="text-slate-400"><span className="font-medium">{log.skipped}</span> skipped</span>
                    {log.errors && (() => { try { return JSON.parse(log.errors).length > 0; } catch { return false; } })() && (
                      <span className="text-red-500">
                        <span className="font-medium">{(() => { try { return JSON.parse(log.errors as string).length; } catch { return "?"; } })()}</span> errors
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Imported opportunities ────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Imported Opportunities</h2>
            <div className="flex items-center gap-1">
              {(["all", "suitable", "maybe"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    filter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f === "all" ? `All (${recentImports.length})` : f === "suitable" ? `✓ Suitable (${suitableCount})` : `~ Maybe (${maybeCount})`}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Globe size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">No opportunities imported yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Make sure Chrome is open, then click &ldquo;Scan Now&rdquo;
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((opp) => {
                const days = daysUntil(opp.deadlineDate);
                const geo: string[]    = (() => { try { return JSON.parse(opp.geography); } catch { return []; } })();
                const themes: string[] = (() => { try { return JSON.parse(opp.thematicAreas); } catch { return []; } })();
                return (
                  <div key={opp.id} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          {opp.fitLabel && (
                            <span className={`mt-0.5 shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${FIT_COLORS[opp.fitLabel as keyof typeof FIT_COLORS] || "bg-slate-100 text-slate-600"}`}>
                              {opp.suitabilityScore}/100
                            </span>
                          )}
                          <Link href={`/opportunities/${opp.id}`} className="font-medium text-slate-800 hover:text-indigo-700 text-sm leading-snug">
                            {opp.title}
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          {opp.donor && <span className="text-xs text-slate-500">{opp.donor.name}</span>}
                          {geo.length > 0 && <span className="text-xs text-slate-400">· {geo.slice(0, 2).join(", ")}</span>}
                          {themes.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                          <span className={`text-[10px] font-medium ${getSourceLabel(opp.sourceUrl).color}`}>
                            via {getSourceLabel(opp.sourceUrl).label}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        {opp.deadlineDate && (
                          <div className={`text-xs font-medium ${days !== null && days <= 7 ? "text-red-600" : days !== null && days <= 14 ? "text-amber-600" : "text-slate-600"}`}>
                            {days !== null && days >= 0 ? `${days}d left` : days !== null ? "Expired" : formatDate(opp.deadlineDate)}
                          </div>
                        )}
                        {opp.sourceUrl && (
                          <a href={opp.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600">
                            <ExternalLink size={10} /> Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Info box ─────────────────────────────────────────────── */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-slate-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 space-y-1">
              <p><span className="font-semibold">How it works:</span> Daleel Madani &amp; EJN are fetched via your local Chrome (AppleScript) to bypass Cloudflare / JS rendering. For9a is fetched directly via HTTP — no browser needed. All results are scored and imported automatically.</p>
              <p><span className="font-semibold">Daily auto-scan:</span> Run <code className="bg-white border border-slate-200 px-1 rounded font-mono text-[11px]">npm run cron</code> to scan all 3 sources automatically every day at 8 AM. Chrome must be running on the machine.</p>
              <p><span className="font-semibold">First run:</span> If Chrome has never visited daleel-madani.org, it may take a few extra seconds to pass the initial security check — this is automatic.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
