import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { checkAiUsage } from "@/lib/ai/rate-limit";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import {
  Sparkles,
  FileText,
  Mail,
  ShieldCheck,
  DollarSign,
  User,
  Search,
  ArrowRight,
} from "lucide-react";

const WRITING_TASKS = [
  {
    type: "CONCEPT_NOTE_DRAFT",
    icon: FileText,
    label: "Concept Note",
    description: "A structured 2-page concept note tailored to the funder's priorities.",
  },
  {
    type: "COVER_LETTER",
    icon: Mail,
    label: "Cover Letter",
    description: "A compelling 1-page cover letter for an application submission.",
  },
  {
    type: "ELIGIBILITY_CHECK",
    icon: ShieldCheck,
    label: "Eligibility Check",
    description: "A plain-language analysis of your eligibility for this opportunity.",
  },
  {
    type: "BUDGET_NARRATIVE",
    icon: DollarSign,
    label: "Budget Narrative",
    description: "A narrative justification for your proposed project budget.",
  },
  {
    type: "BIO",
    icon: User,
    label: "Organizational Bio",
    description: "A tailored bio paragraph for an application or partnership inquiry.",
  },
];

export default async function AiHubPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId } = await getWorkspaceContext();

  const [quota, recentOutputs, recentOpps] = await Promise.all([
    checkAiUsage(workspaceId),
    db.aiOutput.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { opportunity: { select: { id: true, title: true } } },
    }),
    db.opportunityAnalysis.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { opportunity: { select: { id: true, title: true } } },
    }),
  ]);

  const usedPct = quota.limit > 0 ? Math.round((quota.used / quota.limit) * 100) : 0;

  return (
    <div className="p-8 max-w-3xl space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={20} className="text-indigo-500" />
          <h1 className="text-xl font-bold text-slate-800">AI Writing</h1>
        </div>
        <p className="text-sm text-slate-500">
          Generate concept notes, cover letters, and eligibility checks — tailored to your organization's profile.
        </p>
      </div>

      {/* Quota bar */}
      <div className="rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-700">Today's AI requests</p>
          <p className="text-sm font-semibold text-slate-800">
            {quota.used} / {quota.limit}
          </p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usedPct >= 90 ? "bg-red-500" : usedPct >= 70 ? "bg-amber-500" : "bg-indigo-500"
            }`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Resets at midnight UTC · {quota.limit - quota.used} remaining</p>
      </div>

      {/* Writing tasks */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
          What would you like to write?
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Open any opportunity and use the AI Writing tab to generate documents for that specific funder.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {WRITING_TASKS.map(({ icon: Icon, label, description }) => (
            <Link
              key={label}
              href="/opportunities"
              className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors shrink-0 mt-0.5">
                <Icon size={15} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                  {label}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
          {/* Find opportunities CTA */}
          <Link
            href="/opportunities"
            className="flex items-center gap-3 rounded-xl border-2 border-dashed border-indigo-200 p-4 hover:border-indigo-400 hover:bg-indigo-50/60 transition-colors group col-span-full sm:col-span-1"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors shrink-0">
              <Search size={15} className="text-indigo-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-600">Browse opportunities</p>
              <p className="text-xs text-slate-500 mt-0.5">Open an opportunity to start writing</p>
            </div>
            <ArrowRight size={14} className="text-indigo-400 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Recent AI outputs */}
      {recentOutputs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Recent documents
          </h2>
          <div className="space-y-2">
            {recentOutputs.map((out) => (
              <Link
                key={out.id}
                href={out.opportunity ? `/opportunities/${out.opportunity.id}` : "#"}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-indigo-200 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {out.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  {out.opportunity && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{out.opportunity.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-slate-400">{formatDate(out.createdAt)}</span>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent analyses */}
      {recentOpps.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
            Recent analyses
          </h2>
          <div className="space-y-2">
            {recentOpps.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/opportunities/${analysis.opportunity.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 hover:border-indigo-200 hover:bg-slate-50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {analysis.opportunity.title}
                  </p>
                  {analysis.fitLabel && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {analysis.fitLabel.replace("_", " ")} · AI score {analysis.aiScore ?? "—"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-slate-400">{formatDate(analysis.createdAt)}</span>
                  <ArrowRight size={13} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
