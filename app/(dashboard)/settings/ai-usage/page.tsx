import { getWorkspaceContext } from "@/lib/workspace";
import { getAiUsageSummary, checkAiUsage, DAILY_LIMITS } from "@/lib/ai/rate-limit";
import { db } from "@/lib/db";
import { Sparkles, TrendingUp, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AiUsagePage() {
  const { workspaceId } = await getWorkspaceContext();

  const [summary, quota, subscription] = await Promise.all([
    getAiUsageSummary(workspaceId, 30),
    checkAiUsage(workspaceId),
    db.subscription.findUnique({
      where: { workspaceId },
      select: { planType: true, status: true },
    }),
  ]);

  const planType = subscription?.planType ?? "DEFAULT";
  const dailyLimit = DAILY_LIMITS[planType] ?? DAILY_LIMITS.DEFAULT;

  // Group usage by day for a simple chart
  const byDay: Record<string, { count: number; costCents: number }> = {};
  for (const row of summary.rows) {
    const day = row.createdAt.toISOString().split("T")[0];
    if (!byDay[day]) byDay[day] = { count: 0, costCents: 0 };
    byDay[day].count++;
    byDay[day].costCents += row.costUsdCents;
  }

  const dayEntries = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14); // last 14 days

  const maxCount = Math.max(...dayEntries.map(([, v]) => v.count), 1);

  // Group by type
  const byType: Record<string, { count: number; costCents: number }> = {};
  for (const row of summary.rows) {
    if (!byType[row.type]) byType[row.type] = { count: 0, costCents: 0 };
    byType[row.type].count++;
    byType[row.type].costCents += row.costUsdCents;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">AI Usage</h1>
        <p className="text-sm text-slate-500 mt-1">Track your AI request usage and costs over the last 30 days.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Sparkles size={18} className="text-indigo-500" />}
          label="Today's requests"
          value={`${quota.used} / ${quota.limit}`}
          sub={`${quota.remaining} remaining`}
          accent={quota.remaining < 5 ? "amber" : "default"}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-green-500" />}
          label="Total requests (30d)"
          value={summary.totalRequests.toString()}
          sub={`${summary.totalInputTokens.toLocaleString()} input + ${summary.totalOutputTokens.toLocaleString()} output tokens`}
        />
        <StatCard
          icon={<Zap size={18} className="text-amber-500" />}
          label="Total cost (30d)"
          value={`$${summary.totalCostUsd}`}
          sub={`~$${(Number(summary.totalCostUsd) / 30).toFixed(3)} / day avg`}
        />
      </div>

      {/* Daily usage bar chart */}
      {dayEntries.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Daily requests (last 14 days)</h2>
          <div className="flex items-end gap-1.5 h-24">
            {dayEntries.map(([day, v]) => {
              const height = Math.max(4, Math.round((v.count / maxCount) * 88));
              const label = day.slice(5); // MM-DD
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1" title={`${day}: ${v.count} requests, $${(v.costCents / 100).toFixed(3)}`}>
                  <div
                    className="w-full rounded-t bg-indigo-400 hover:bg-indigo-500 transition-colors"
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[9px] text-slate-400 rotate-45 origin-left translate-y-1 translate-x-1">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
            <span>Daily limit: <strong>{dailyLimit} requests</strong></span>
            <span>Plan: <strong>{planType}</strong></span>
          </div>
        </div>
      )}

      {/* Usage by type */}
      {Object.keys(byType).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Usage by type</h2>
          <div className="space-y-3">
            {Object.entries(byType)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([type, v]) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-500 w-40 shrink-0">
                    {type.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${(v.count / summary.totalRequests) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 w-8 text-right">{v.count}</span>
                  <span className="text-xs text-slate-400 w-16 text-right">
                    ${(v.costCents / 100).toFixed(3)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {summary.totalRequests === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Sparkles size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No AI requests yet in the last 30 days.</p>
          <p className="text-xs text-slate-400 mt-1">
            Use the AI Analysis or Writing Assistant on any opportunity to get started.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent?: "default" | "amber";
}) {
  return (
    <div className={`rounded-xl border p-5 ${accent === "amber" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}
