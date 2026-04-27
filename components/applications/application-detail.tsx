"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { NotesList } from "@/components/notes/notes-list";
import { AddNoteForm } from "@/components/notes/add-note-form";
import { TasksPanel } from "@/components/tasks/tasks-panel";
import { updateApplicationStage, updateApplication, recordResult, refreshReadinessGaps, resolveGap } from "@/lib/actions/applications";
import {
  formatDate, daysUntil, formatCurrency, STAGE_LABELS, STAGE_COLORS,
} from "@/lib/utils";
import { ChevronRight, AlertTriangle, CheckCircle2, Clock, Plus } from "lucide-react";
import type { AppStage } from "@/app/generated/prisma/client";

const STAGE_OPTIONS: { value: AppStage; label: string }[] = [
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

const SEVERITY_COLORS = { HIGH: "text-red-600 bg-red-50", MEDIUM: "text-amber-600 bg-amber-50", LOW: "text-slate-600 bg-slate-50" };

export function ApplicationDetail({ app, users, currentUserId }: { app: any; users: any[]; currentUserId: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "documents" | "notes" | "gaps" | "history">("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [, startTransition] = useTransition();

  const days = daysUntil(app.donorDeadline || app.internalDeadline);
  const openGaps = app.readinessGaps?.filter((g: any) => !g.isResolved) || [];
  const openTasks = app.tasks?.filter((t: any) => t.status !== "DONE" && t.status !== "CANCELLED") || [];

  function handleStageChange(stage: AppStage) {
    startTransition(async () => {
      await updateApplicationStage(app.id, stage);
    });
  }

  function handleRefreshGaps() {
    startTransition(async () => {
      await refreshReadinessGaps(app.id);
    });
  }

  function handleResolveGap(gapId: string) {
    startTransition(async () => {
      await resolveGap(gapId);
    });
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateApplication(app.id, data);
      setShowEditModal(false);
    });
  }

  async function handleResultSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await recordResult(
        app.id,
        data.get("result") as "AWARDED",
        data.get("amountAwarded") ? Number(data.get("amountAwarded")) : undefined
      );
      setShowResultModal(false);
    });
  }

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "tasks", label: `Tasks${openTasks.length > 0 ? ` (${openTasks.length})` : ""}` },
    { key: "documents", label: "Documents" },
    { key: "notes", label: "Notes" },
    { key: "gaps", label: `Gaps${openGaps.length > 0 ? ` (${openGaps.length})` : ""}` },
    { key: "history", label: "History" },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/applications" className="hover:text-indigo-600">Applications</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600 truncate max-w-xs">{app.opportunity?.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-800 leading-tight">{app.opportunity?.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {app.donor && (
                <Link href={`/donors/${app.donorId}`} className="text-sm text-indigo-600 font-medium hover:underline">
                  {app.donor.name}
                </Link>
              )}
              <Badge className={STAGE_COLORS[app.stage]}>{STAGE_LABELS[app.stage]}</Badge>
              {app.owner && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">
                    {app.owner.name[0]}
                  </div>
                  {app.owner.name}
                </span>
              )}
              {days !== null && (
                <span className={`flex items-center gap-1 text-sm ${days <= 3 ? "text-red-600 font-semibold" : days <= 7 ? "text-orange-600" : "text-slate-500"}`} suppressHydrationWarning>
                  {days <= 7 && <AlertTriangle size={13} />}
                  <Clock size={13} />
                  {days <= 0 ? "Overdue" : `${days}d`} · {formatDate(app.donorDeadline || app.internalDeadline)}
                </span>
              )}
              {openGaps.length > 0 && (
                <Badge className="bg-red-100 text-red-600">{openGaps.length} gaps</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Select
              options={STAGE_OPTIONS}
              value={app.stage}
              onChange={(e) => handleStageChange(e.target.value as AppStage)}
              className="w-44 text-xs"
            />
            <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>Edit</Button>
            {app.stage === "SUBMITTED" && (
              <Button size="sm" onClick={() => setShowResultModal(true)}>Record Result</Button>
            )}
          </div>
        </div>

        {/* Blockers alert */}
        {app.blockers && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2">
            <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700"><span className="font-semibold">Blocker:</span> {app.blockers}</p>
          </div>
        )}

        {/* Next action */}
        {app.nextAction && (
          <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
            <CheckCircle2 size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Next action:</span> {app.nextAction}
              {app.nextActionDueDate && ` · due ${formatDate(app.nextActionDueDate)}`}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                activeTab === key
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-6 max-w-4xl">
            <Card>
              <CardHeader><CardTitle>Key Dates</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Field label="Donor Deadline" value={formatDate(app.donorDeadline)} />
                <Field label="Internal Deadline" value={formatDate(app.internalDeadline)} />
                <Field label="Decision Date" value={formatDate(app.decisionDate)} />
                <Field label="Submission Date" value={formatDate(app.submissionDate)} />
                <Field label="Result Date" value={formatDate(app.resultDate)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Financials & Confidence</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Field label="Amount Requested" value={formatCurrency(app.amountRequested)} />
                <Field label="Amount Awarded" value={formatCurrency(app.amountAwarded)} />
                <Field label="Confidence" value={app.confidenceLevel} />
                <Field label="Result" value={app.result} />
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardHeader><CardTitle>Stage Timeline</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-0 flex-wrap">
                  {app.stageHistory?.map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center">
                      <div className="text-center px-3">
                        <p className="text-xs font-medium text-slate-700">{STAGE_LABELS[s.stage]}</p>
                        <p className="text-xs text-slate-400">{formatDate(s.enteredAt)}</p>
                        {s.enteredBy && <p className="text-xs text-slate-400">{s.enteredBy.name}</p>}
                      </div>
                      {i < app.stageHistory.length - 1 && (
                        <ChevronRight size={14} className="text-slate-300" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "tasks" && (
          <TasksPanel applicationId={app.id} tasks={app.tasks} users={users} />
        )}

        {activeTab === "notes" && (
          <div className="max-w-2xl">
            <AddNoteForm subjectType="application" subjectId={app.id} />
            <div className="mt-4">
              <NotesList notes={app.appNotes} />
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="max-w-2xl">
            <p className="text-sm text-slate-500 py-4">Document upload coming soon. For now, note document locations in the Notes tab.</p>
            {app.appAttachments?.length > 0 && (
              <div className="space-y-2">
                {app.appAttachments.map((a: any) => (
                  <div key={a.id} className="rounded-lg border border-slate-200 p-3 bg-white flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{a.title || a.fileName}</p>
                      <p className="text-xs text-slate-400">{a.docType} · {formatDate(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "gaps" && (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{openGaps.length} unresolved gaps</p>
              <Button variant="secondary" size="sm" onClick={handleRefreshGaps}>
                Refresh Gaps
              </Button>
            </div>
            {app.readinessGaps?.map((gap: any) => (
              <div
                key={gap.id}
                className={`rounded-lg border p-4 flex items-start justify-between gap-4 ${
                  gap.isResolved ? "opacity-50 bg-slate-50" : "bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={SEVERITY_COLORS[gap.severity as "HIGH" | "MEDIUM" | "LOW"]}>
                      {gap.severity}
                    </Badge>
                    <span className="text-xs font-medium text-slate-600">{gap.gapType.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-sm text-slate-700">{gap.description}</p>
                  {gap.isResolved && (
                    <p className="text-xs text-green-600 mt-1">✓ Resolved {formatDate(gap.resolvedAt)}</p>
                  )}
                </div>
                {!gap.isResolved && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleResolveGap(gap.id)}
                    className="shrink-0"
                  >
                    Mark resolved
                  </Button>
                )}
              </div>
            ))}
            {(!app.readinessGaps || app.readinessGaps.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No readiness gaps tracked yet.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={handleRefreshGaps}>
                  Check readiness
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-2xl space-y-2">
            {app.activityLogs?.map((log: any) => (
              <div key={log.id} className="text-sm text-slate-600 py-2 border-b border-slate-100">
                <span className="font-medium text-slate-800">{log.user?.name || "System"}</span>{" "}
                {log.action.replace(/_/g, " ")}{" "}
                <span className="text-slate-400 text-xs">· {formatDate(log.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Application" size="md">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Select
            label="Owner"
            name="ownerId"
            placeholder="Select owner..."
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            defaultValue={app.ownerId || ""}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Internal Deadline" name="internalDeadline" type="date" defaultValue={app.internalDeadline?.toISOString().split("T")[0]} />
            <Input label="Donor Deadline" name="donorDeadline" type="date" defaultValue={app.donorDeadline?.toISOString().split("T")[0]} />
          </div>
          <Input label="Amount Requested" name="amountRequested" type="number" defaultValue={app.amountRequested} />
          <Select
            label="Confidence Level"
            name="confidenceLevel"
            options={[
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
            defaultValue={app.confidenceLevel}
          />
          <Textarea label="Blockers" name="blockers" placeholder="Any blockers preventing progress..." defaultValue={app.blockers || ""} />
          <Textarea label="Next Action" name="nextAction" placeholder="What needs to happen next?" defaultValue={app.nextAction || ""} />
          <Input label="Next Action Due" name="nextActionDueDate" type="date" defaultValue={app.nextActionDueDate?.toISOString().split("T")[0]} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Result Modal */}
      <Modal open={showResultModal} onClose={() => setShowResultModal(false)} title="Record Result">
        <form onSubmit={handleResultSubmit} className="space-y-4">
          <Select
            label="Result"
            name="result"
            required
            options={[
              { value: "AWARDED", label: "Awarded" },
              { value: "REJECTED", label: "Rejected" },
              { value: "NO_RESPONSE", label: "No Response" },
              { value: "WITHDRAWN", label: "Withdrawn" },
            ]}
          />
          <Input label="Amount Awarded (if applicable)" name="amountAwarded" type="number" />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowResultModal(false)}>Cancel</Button>
            <Button type="submit">Record Result</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-700 font-medium">{value}</span>
    </div>
  );
}
