"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateApplicationStage } from "@/lib/actions/applications";
import { formatDate, daysUntil, formatCurrency, STAGE_LABELS } from "@/lib/utils";
import { AlertTriangle, Clock, CheckSquare, ChevronDown } from "lucide-react";
import type { AppStage } from "@/app/generated/prisma/client";

const KANBAN_COLUMNS: { stage: AppStage; label: string; color: string }[] = [
  { stage: "PREPARATION", label: "Preparation", color: "border-t-slate-400" },
  { stage: "CONCEPT_NOTE", label: "Concept Note", color: "border-t-blue-400" },
  { stage: "PROPOSAL", label: "Proposal", color: "border-t-indigo-500" },
  { stage: "INTERNAL_REVIEW", label: "Internal Review", color: "border-t-amber-500" },
  { stage: "SUBMITTED", label: "Submitted", color: "border-t-cyan-500" },
];

const RESULT_STAGES: { stage: AppStage; label: string; color: string }[] = [
  { stage: "AWARDED", label: "Awarded", color: "border-t-green-500" },
  { stage: "REJECTED", label: "Rejected", color: "border-t-red-400" },
  { stage: "NO_RESPONSE", label: "No Response", color: "border-t-gray-400" },
];

const STAGE_TRANSITION_OPTIONS: { value: AppStage; label: string }[] = [
  { value: "PREPARATION", label: "Preparation" },
  { value: "CONCEPT_NOTE", label: "Concept Note" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "INTERNAL_REVIEW", label: "Internal Review" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "AWARDED", label: "Awarded" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NO_RESPONSE", label: "No Response" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export function ApplicationsBoard({ applications, users }: { applications: any[]; users: any[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const activeApps = applications.filter(
    (a) => !["AWARDED", "REJECTED", "NO_RESPONSE", "WITHDRAWN"].includes(a.stage)
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Applications Pipeline</h1>
          <p className="text-xs text-slate-500">{activeApps.length} active · {applications.length} total</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "kanban" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            Board
          </Button>
          <Button
            variant={view === "list" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setView("list")}
          >
            List
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanView applications={activeApps} />
      ) : (
        <ListView applications={applications} />
      )}
    </div>
  );
}

function KanbanView({ applications }: { applications: any[] }) {
  return (
    <div className="flex-1 overflow-x-auto p-6">
      <div className="flex gap-4 h-full min-w-max">
        {KANBAN_COLUMNS.map(({ stage, label, color }) => {
          const cards = applications.filter((a) => a.stage === stage);
          return (
            <div key={stage} className="flex flex-col w-64 flex-shrink-0">
              <div className={`rounded-t-md border-t-4 ${color} bg-white border border-slate-200 px-3 py-2.5 flex items-center justify-between`}>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-50 border border-t-0 border-slate-200 rounded-b-md p-2 space-y-2 min-h-[300px]">
                {cards.map((app) => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApplicationCard({ app }: { app: any }) {
  const [, startTransition] = useTransition();
  const days = daysUntil(app.donorDeadline || app.internalDeadline);

  function handleStageChange(stage: AppStage) {
    startTransition(async () => {
      await updateApplicationStage(app.id, stage);
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 hover:border-indigo-200 transition-colors">
      <Link href={`/applications/${app.id}`} className="block">
        <p className="text-sm font-medium text-slate-800 leading-tight hover:text-indigo-700 line-clamp-2">
          {app.opportunity?.title}
        </p>
        {app.donor && (
          <p className="text-xs text-slate-500 mt-0.5">{app.donor.name}</p>
        )}
      </Link>

      <div className="mt-2.5 space-y-1.5">
        {days !== null && (
          <div className={`flex items-center gap-1 text-xs ${days <= 7 ? "text-red-600" : days <= 14 ? "text-orange-500" : "text-slate-500"}`} suppressHydrationWarning>
            {days <= 7 && <AlertTriangle size={11} />}
            <Clock size={11} />
            {days <= 0 ? "Overdue" : `${days}d left`} · {formatDate(app.donorDeadline || app.internalDeadline)}
          </div>
        )}

        <div className="flex items-center justify-between">
          {app.owner && (
            <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold">
              {app.owner.name[0]}
            </div>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {app.tasks?.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                <CheckSquare size={11} /> {app.tasks.length}
              </span>
            )}
            {app.readinessGaps?.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-red-500">
                <AlertTriangle size={11} /> {app.readinessGaps.length}
              </span>
            )}
            {app.confidenceLevel && (
              <ConfidenceDot level={app.confidenceLevel} />
            )}
          </div>
        </div>

        {app.blockers && (
          <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 line-clamp-1">⚠ {app.blockers}</p>
        )}
      </div>

      {/* Quick stage change */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <select
          className="w-full text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:border-indigo-400"
          value={app.stage}
          onChange={(e) => handleStageChange(e.target.value as AppStage)}
          onClick={(e) => e.preventDefault()}
        >
          {STAGE_TRANSITION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ConfidenceDot({ level }: { level: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-green-400",
    MEDIUM: "bg-amber-400",
    LOW: "bg-red-400",
  };
  return (
    <span
      className={`h-2 w-2 rounded-full ${colors[level] || "bg-slate-300"}`}
      title={`Confidence: ${level}`}
    />
  );
}

function ListView({ applications }: { applications: any[] }) {
  return (
    <div className="flex-1 overflow-auto px-6 py-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Opportunity</th>
            <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Donor</th>
            <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Stage</th>
            <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Owner</th>
            <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Deadline</th>
            <th className="text-left py-2 text-xs text-slate-500 font-medium uppercase">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {applications.map((app) => {
            const days = daysUntil(app.donorDeadline);
            const STAGE_COLORS: Record<string, string> = {
              PREPARATION: "bg-slate-100 text-slate-700",
              CONCEPT_NOTE: "bg-blue-100 text-blue-700",
              PROPOSAL: "bg-indigo-100 text-indigo-700",
              INTERNAL_REVIEW: "bg-amber-100 text-amber-700",
              SUBMITTED: "bg-cyan-100 text-cyan-700",
              AWARDED: "bg-green-100 text-green-700",
              REJECTED: "bg-red-100 text-red-700",
              NO_RESPONSE: "bg-gray-100 text-gray-600",
              WITHDRAWN: "bg-gray-100 text-gray-500",
            };
            return (
              <tr key={app.id} className="hover:bg-slate-50">
                <td className="py-3 pr-4">
                  <Link href={`/applications/${app.id}`} className="font-medium text-slate-800 hover:text-indigo-700">
                    {app.opportunity?.title}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-slate-600">{app.donor?.name || "—"}</td>
                <td className="py-3 pr-4">
                  <Badge className={STAGE_COLORS[app.stage] || "bg-slate-100 text-slate-600"}>
                    {STAGE_LABELS[app.stage]}
                  </Badge>
                </td>
                <td className="py-3 pr-4 text-slate-600">{app.owner?.name || "—"}</td>
                <td className="py-3 pr-4">
                  {app.donorDeadline ? (
                    <span className={days !== null && days <= 7 ? "text-red-600 font-medium" : "text-slate-600"}>
                      {formatDate(app.donorDeadline)}
                    </span>
                  ) : "—"}
                </td>
                <td className="py-3 text-slate-600">{formatCurrency(app.amountRequested) || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
