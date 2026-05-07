"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Loader2, Clock, Globe, Shield, Zap, Database,
  Activity, HelpCircle,
} from "lucide-react";

type HealthStatus = "HEALTHY" | "DEGRADED" | "FAILING" | "UNCHECKED";

interface SourceData {
  id: string;
  name: string;
  url: string;
  strategy: string;
  isActive: boolean;
  healthStatus: HealthStatus;
  healthCheckedAt: string | null;
  healthError: string | null;
  consecutiveFailures: number;
  lastScrapedAt: string | null;
  lastSuccessAt: string | null;
}

interface LogData {
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  imported: number;
  skipped: number;
  source: string;
}

// ── Status display helpers ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<HealthStatus, {
  icon: React.ReactNode;
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  HEALTHY: {
    icon: <CheckCircle2 size={14} />,
    label: "Healthy",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  DEGRADED: {
    icon: <AlertTriangle size={14} />,
    label: "Needs browser",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  FAILING: {
    icon: <XCircle size={14} />,
    label: "Failing",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  UNCHECKED: {
    icon: <HelpCircle size={14} />,
    label: "Not checked yet",
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
    dot: "bg-slate-300",
  },
};

function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StrategyBadge({ strategy }: { strategy: string }) {
  const map: Record<string, { label: string; color: string }> = {
    PLAYWRIGHT: { label: "Playwright", color: "bg-violet-100 text-violet-700" },
    HTTP: { label: "HTTP", color: "bg-blue-100 text-blue-700" },
    AUTO: { label: "Auto", color: "bg-slate-100 text-slate-600" },
  };
  const cfg = map[strategy] ?? { label: strategy, color: "bg-slate-100 text-slate-600" };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HealthDashboardClient({
  sources,
  recentLogs,
  stuckJobs: initialStuckJobs,
}: {
  sources: SourceData[];
  recentLogs: LogData[];
  stuckJobs: number;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ healthy: number; degraded: number; failing: number } | null>(null);

  async function runCheck() {
    setRunning(true);
    setDone(false);
    setLog([]);
    setSummary(null);

    try {
      const res = await fetch("/api/health-check", { method: "POST" });
      if (!res.body) { setRunning(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const { msg } = JSON.parse(line.slice(6));
            if (!msg) continue;
            if (msg.startsWith("__DONE__:")) {
              const s = JSON.parse(msg.slice(9));
              if (!s.error) setSummary(s);
              setDone(true);
              router.refresh();
            } else {
              setLog((prev) => [...prev, msg]);
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setLog((prev) => [...prev, "❌ Connection error"]);
      setDone(true);
    } finally {
      setRunning(false);
    }
  }

  const allHealthy = sources.every((s) => s.healthStatus === "HEALTHY" || !s.isActive);
  const hasIssues = sources.some((s) => s.healthStatus === "FAILING" || s.healthStatus === "DEGRADED");

  return (
    <div className="space-y-6">
      {/* Overall status banner */}
      {sources.length > 0 && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
          allHealthy
            ? "bg-green-50 border-green-200 text-green-800"
            : hasIssues
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          {allHealthy ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {allHealthy
            ? "All sources are healthy"
            : `${sources.filter((s) => s.healthStatus === "FAILING").length} source(s) failing, ${sources.filter((s) => s.healthStatus === "DEGRADED").length} degraded`}
          {initialStuckJobs > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
              {initialStuckJobs} stuck scan job(s)
            </span>
          )}
        </div>
      )}

      {/* Run check button + progress */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">Manual Health Check</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tests connectivity, Cloudflare detection, site structure, and more for every source.
              Stuck jobs are auto-fixed.
            </p>
          </div>
          <button
            onClick={runCheck}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {running ? "Checking…" : "Run Check Now"}
          </button>
        </div>

        {/* Log output */}
        {log.length > 0 && (
          <div className="bg-slate-950 rounded-lg p-4 text-xs font-mono space-y-0.5 max-h-56 overflow-y-auto">
            {log.map((line, i) => (
              <p key={i} className={
                line.includes("❌") ? "text-red-400" :
                line.includes("⚠️") ? "text-amber-400" :
                line.includes("✅") || line.includes("✓") ? "text-green-400" :
                line.includes("🔧") ? "text-violet-400" :
                "text-slate-300"
              }>
                {line}
              </p>
            ))}
            {done && summary && (
              <p className="text-slate-500 mt-2 pt-2 border-t border-slate-800">
                Final: {summary.healthy} healthy · {summary.degraded} degraded · {summary.failing} failing
              </p>
            )}
          </div>
        )}
      </div>

      {/* Source cards */}
      <div>
        <h2 className="font-semibold text-slate-800 text-sm mb-3">
          Source Status {sources.length > 0 && <span className="text-slate-400 font-normal">({sources.length})</span>}
        </h2>

        {sources.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
            <Globe size={24} className="mx-auto mb-2 opacity-40" />
            <p>No custom sources configured.</p>
            <p className="text-xs mt-1">Built-in sources (Daleel Madani, EJN, For9a) are checked automatically.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => {
              const cfg = STATUS_CONFIG[s.healthStatus];
              const issues = s.healthError ? s.healthError.split(" | ") : [];

              return (
                <div key={s.id} className={`border rounded-lg p-4 ${cfg.border} ${!s.isActive ? "opacity-60" : ""}`}>
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <div className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${cfg.dot} ${
                      s.healthStatus === "FAILING" && s.consecutiveFailures > 0 ? "animate-pulse" : ""
                    }`} />

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 text-sm">{s.name}</span>
                        <StrategyBadge strategy={s.strategy} />
                        {!s.isActive && (
                          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Paused</span>
                        )}
                        {s.consecutiveFailures > 1 && (
                          <span className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            {s.consecutiveFailures} consecutive failures
                          </span>
                        )}
                      </div>

                      {/* URL */}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-slate-400 hover:text-indigo-600 truncate block max-w-sm mt-0.5"
                      >
                        {s.url}
                      </a>

                      {/* Status badge + time */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> Checked {timeAgo(s.healthCheckedAt)}
                        </span>
                        {s.lastSuccessAt && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Activity size={11} /> Last success {timeAgo(s.lastSuccessAt)}
                          </span>
                        )}
                      </div>

                      {/* Issues list */}
                      {issues.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {issues.map((issue, i) => {
                            const isCf = issue.toLowerCase().includes("cloudflare");
                            const isOk = issue.includes("✓");
                            return (
                              <div key={i} className={`flex items-start gap-1.5 text-xs ${
                                isOk ? "text-green-700" : isCf ? "text-amber-700" : "text-slate-600"
                              }`}>
                                {isOk
                                  ? <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-green-500" />
                                  : isCf
                                  ? <Shield size={11} className="mt-0.5 shrink-0 text-amber-500" />
                                  : <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-500" />}
                                <span>{issue}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Cloudflare explanation tip */}
                      {s.healthStatus === "FAILING" && s.healthError?.toLowerCase().includes("cloudflare") && !s.healthError?.includes("✓") && (
                        <div className="mt-2 px-2 py-1.5 bg-slate-100 rounded text-xs text-slate-600 leading-relaxed">
                          💡 <strong>This is expected.</strong> This site uses Cloudflare protection that blocks plain HTTP.
                          The scraper uses a Playwright browser to bypass it — if scraping is failing, the browser may not be installed on the server.
                          Check Railway build logs for <code className="bg-slate-200 px-0.5 rounded">playwright install chromium</code>.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* What we check */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-3">What the health check tests</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: <Globe size={13} />, label: "DNS & Connectivity", desc: "Domain exists and server responds" },
            { icon: <Shield size={13} />, label: "HTTP Status", desc: "429 rate limit, 403 blocked, 5xx server errors" },
            { icon: <Shield size={13} />, label: "Cloudflare / Bot Protection", desc: "Detects CF challenges requiring Playwright" },
            { icon: <Shield size={13} />, label: "Auth Wall", desc: "Detects login-required pages" },
            { icon: <Database size={13} />, label: "Content Size", desc: "Response too short = error page" },
            { icon: <Activity size={13} />, label: "Site Structure", desc: "Expected HTML selectors still present" },
            { icon: <Zap size={13} />, label: "Playwright Status", desc: "Browser availability for CF-protected sites" },
            { icon: <Clock size={13} />, label: "Stuck Jobs (auto-fix)", desc: "RUNNING jobs >30 min are auto-cancelled" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 text-indigo-500 shrink-0">{item.icon}</span>
              <div>
                <span className="font-medium text-slate-700">{item.label}</span>
                <span className="text-slate-500"> — {item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent ingest logs */}
      {recentLogs.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Recent Scan History</h2>
          <div className="space-y-1.5">
            {recentLogs.map((log, i) => {
              const statusColor =
                log.status === "COMPLETED" ? "text-green-600" :
                log.status === "PARTIAL"   ? "text-amber-600" :
                log.status === "RUNNING"   ? "text-blue-600" :
                "text-red-600";
              const duration =
                log.startedAt && log.completedAt
                  ? Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)
                  : null;

              return (
                <div key={i} className="flex items-center gap-3 text-xs py-2 px-3 bg-white border border-slate-100 rounded-lg">
                  <span className={`font-medium ${statusColor} w-20 shrink-0`}>{log.status}</span>
                  <span className="text-slate-500">{timeAgo(log.startedAt)}</span>
                  <span className="text-slate-600">
                    {log.imported} imported · {log.skipped} skipped
                  </span>
                  {duration !== null && (
                    <span className="text-slate-400">{duration}s</span>
                  )}
                  {log.status === "RUNNING" && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> Might be stuck
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
