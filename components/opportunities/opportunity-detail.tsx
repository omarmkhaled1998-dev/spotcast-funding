"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { NotesList } from "@/components/notes/notes-list";
import { AddNoteForm } from "@/components/notes/add-note-form";
import { recordDecision } from "@/lib/actions/opportunities";
import { requestOpportunityAnalysis, generateDocument } from "@/lib/actions/ai";
import { toast } from "sonner";
import {
  formatDate,
  daysUntil,
  formatCurrency,
  parseJsonArray,
  FIT_LABELS,
  STATUS_LABELS,
  STAGE_LABELS,
  STAGE_COLORS,
} from "@/lib/utils";
import {
  ArrowLeft,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PauseCircle,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  Mail,
  HelpCircle,
  Loader2,
} from "lucide-react";

// ─── Writing task labels ──────────────────────────────────────────────────────

const WRITING_BUTTONS = [
  { type: "CONCEPT_NOTE_DRAFT", icon: FileText,   label: "Generate concept note" },
  { type: "COVER_LETTER",       icon: Mail,        label: "Write cover email" },
  { type: "ELIGIBILITY_CHECK",  icon: HelpCircle,  label: "Explain this opportunity" },
] as const;

const WRITING_LABEL: Record<string, string> = Object.fromEntries(
  WRITING_BUTTONS.map(({ type, label }) => [type, label])
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  opp: any;
  donors: { id: string; name: string }[];
  users: { id: string; name: string }[];
  currentUserId: string;
  aiAnalysis?: any;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function OpportunityDetail({ opp, donors, users, currentUserId, aiAnalysis }: Props) {
  const [, startTransition] = useTransition();
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // AI analysis state
  const [analysis, setAnalysis] = useState<any>(aiAnalysis ?? null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  // Inline writing state
  const [writingTask, setWritingTask] = useState<string | null>(null);
  const [writingOutput, setWritingOutput] = useState<string | null>(null);
  const [writingLoading, setWritingLoading] = useState(false);

  const days = daysUntil(opp.deadlineDate);

  // Auto-analysis disabled — user triggers manually via the "Analyse" button

  function triggerAnalysis(force: boolean) {
    setAnalysisLoading(true);
    setAnalysisError("");
    startTransition(async () => {
      const result = await requestOpportunityAnalysis(opp.id, force);
      if ("error" in result) {
        setAnalysisError(result.error as string);
      } else {
        setAnalysis(result);
      }
      setAnalysisLoading(false);
    });
  }

  function handleDecision(decision: "PURSUE" | "HOLD" | "DECLINE", reason: string) {
    startTransition(async () => {
      await recordDecision(opp.id, decision, reason);
      setShowDecisionModal(false);
      toast.success(
        decision === "PURSUE"
          ? "Marked as pursuing"
          : decision === "HOLD"
          ? "Placed on hold"
          : "Marked as declined"
      );
    });
  }

  async function handleWrite(taskType: string, label: string) {
    setWritingTask(taskType);
    setWritingOutput(null);
    setWritingLoading(true);
    const result = await generateDocument(taskType as any, opp.id);
    setWritingLoading(false);
    if ("error" in result) {
      toast.error(result.error as string);
      setWritingTask(null);
    } else {
      setWritingOutput((result as any).content ?? "");
      toast.success(`${label} generated`);
    }
  }

  function copyOutput() {
    if (!writingOutput) return;
    navigator.clipboard.writeText(writingOutput);
    toast.success("Copied to clipboard");
  }

  // Score badge colours
  const scoreBg =
    opp.fitLabel === "SUITABLE"
      ? "bg-green-100 text-green-800 border-green-200"
      : opp.fitLabel === "MAYBE"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : opp.fitLabel === "NOT_SUITABLE"
      ? "bg-red-100 text-red-700 border-red-200"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 px-6 pt-4 pb-4">
        {/* Back link */}
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors mb-3"
        >
          <ArrowLeft size={13} />
          Opportunities
        </Link>

        <div className="flex items-start justify-between gap-4">
          {/* Title + meta row */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 leading-snug">{opp.title}</h1>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Donor */}
              {opp.donor && (
                <Link
                  href={`/donors/${opp.donorId}`}
                  className="text-sm text-indigo-600 hover:underline font-medium"
                >
                  {opp.donor.name}
                </Link>
              )}

              {/* Deadline */}
              {opp.deadlineDate ? (
                <span
                  className={`flex items-center gap-1 text-sm ${
                    days !== null && days <= 7
                      ? "text-red-600 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  {days !== null && days <= 7 && <AlertTriangle size={12} />}
                  {formatDate(opp.deadlineDate)}
                  {days !== null && (
                    <span className="text-xs" suppressHydrationWarning>
                      ({days <= 0 ? "overdue" : `${days}d`})
                    </span>
                  )}
                </span>
              ) : null}

              {/* Score badge */}
              {opp.suitabilityScore != null && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg}`}
                >
                  {opp.suitabilityScore}/100
                  {opp.fitLabel && (
                    <span className="opacity-80">
                      · {FIT_LABELS[opp.fitLabel] ?? opp.fitLabel.replace("_", " ")}
                    </span>
                  )}
                </span>
              )}

              {/* Status */}
              <StatusBadge status={opp.status} />

              {/* External link */}
              {opp.sourceUrl && (
                <a
                  href={opp.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-indigo-600"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {opp.application ? (
              <Link href={`/applications/${opp.application.id}`}>
                <Button variant="secondary" size="sm">View Application</Button>
              </Link>
            ) : !opp.decision ? (
              <Button size="sm" onClick={() => setShowDecisionModal(true)}>
                Pursue this grant
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-slate-200">

        {/* Main column (full → 2/3 on large) */}
        <div className="lg:col-span-2 overflow-auto">
          <div className="p-6 space-y-5">

            {/* Decision banner */}
            {opp.decision && (
              <DecisionBanner decision={opp.decision} onReopen={() => setShowDecisionModal(true)} />
            )}

            {/* ── AI Summary (always visible) ───────────────────────────── */}
            <AiSummarySection
              analysis={analysis}
              loading={analysisLoading}
              error={analysisError}
              onRefresh={() => triggerAnalysis(true)}
            />

            {/* ── 3 Writing action buttons ──────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {WRITING_BUTTONS.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  type="button"
                  disabled={writingLoading}
                  onClick={() => handleWrite(type, label)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    writingTask === type
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
                  } disabled:opacity-40`}
                >
                  {writingLoading && writingTask === type ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Icon size={13} />
                  )}
                  {label}
                </button>
              ))}
            </div>

            {/* Writing output */}
            {writingOutput && (
              <div className="rounded-xl border border-indigo-100 bg-slate-50">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    {writingTask?.replace(/_/g, " ").toLowerCase()}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      ~{Math.round(writingOutput.split(" ").length)} words
                    </span>
                    <button
                      onClick={copyOutput}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <Copy size={12} />
                      Copy
                    </button>
                    <button
                      onClick={() => writingTask && handleWrite(writingTask, WRITING_LABEL[writingTask] ?? writingTask)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                    >
                      <RefreshCw size={12} />
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="px-4 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {writingOutput}
                </div>
              </div>
            )}

            {/* ── Details (collapsed by default) ────────────────────────── */}
            <div className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-xl"
              >
                <span>Details</span>
                {showDetails ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
              </button>

              {showDetails && (
                <div className="px-4 pb-4 pt-1 space-y-5 border-t border-slate-100">
                  {(opp.summary || opp.fullDescription) && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                      {opp.summary && <p className="text-sm text-slate-700 mb-2">{opp.summary}</p>}
                      {opp.fullDescription && (
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {opp.fullDescription}
                        </p>
                      )}
                    </div>
                  )}

                  {opp.eligibilitySummary && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Eligibility</p>
                      <p className="text-sm text-slate-700">{opp.eligibilitySummary}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</p>
                    <AddNoteForm subjectType="opportunity" subjectId={opp.id} />
                    <div className="mt-3">
                      <NotesList notes={opp.oppNotes} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Sidebar (full → 1/3 on large) ─────────────────────────────── */}
        <div className="overflow-auto p-5 space-y-5 border-t border-slate-200 lg:border-t-0">
          <MetaField label="Donor" value={opp.donor?.name} />
          <MetaField label="Application Type" value={opp.applicationType} />
          <MetaField
            label="Funding Range"
            value={
              opp.fundingAmountMin || opp.fundingAmountMax
                ? `${formatCurrency(opp.fundingAmountMin, opp.currency)} – ${formatCurrency(opp.fundingAmountMax, opp.currency)}`
                : null
            }
          />
          <MetaField label="Language" value={opp.languageRequirement} />
          {opp.partnerRequired && (
            <MetaField label="Partner Required" value="Yes" />
          )}

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Thematic Areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {parseJsonArray(opp.thematicAreas).map((t: string) => (
                <Badge key={t} variant="default" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Geography
            </p>
            <div className="flex flex-wrap gap-1.5">
              {parseJsonArray(opp.geography).map((g: string) => (
                <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
              ))}
            </div>
          </div>

          {/* Linked application */}
          {opp.application && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-2">
                Application
              </p>
              <Badge className={STAGE_COLORS[opp.application.stage]}>
                {STAGE_LABELS[opp.application.stage]}
              </Badge>
              {opp.application.owner && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Owner: {opp.application.owner.name}
                </p>
              )}
              <Link href={`/applications/${opp.application.id}`} className="mt-2 block">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  View Application →
                </Button>
              </Link>
            </div>
          )}

          {/* Recent activity */}
          {opp.activityLogs?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                Activity
              </p>
              <div className="space-y-2">
                {opp.activityLogs.slice(0, 4).map((log: any) => (
                  <div key={log.id} className="text-xs text-slate-500 leading-relaxed">
                    <span className="font-medium text-slate-600">
                      {log.user?.name || "System"}
                    </span>{" "}
                    {log.action.replace(/_/g, " ")}
                    <span className="text-slate-400"> · {formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decision modal */}
      <DecisionModal
        open={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        onDecide={handleDecision}
        existing={opp.decision}
      />
    </div>
  );
}

// ── AI Summary Section ────────────────────────────────────────────────────────

function AiSummarySection({
  analysis,
  loading,
  error,
  onRefresh,
}: {
  analysis: any;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}) {
  const fitBorder: Record<string, string> = {
    SUITABLE:    "border-green-200 bg-green-50/60",
    MAYBE:       "border-amber-200 bg-amber-50/60",
    NOT_SUITABLE:"border-red-200   bg-red-50/60",
  };
  const borderClass = analysis?.fitLabel
    ? (fitBorder[analysis.fitLabel] ?? "border-slate-200 bg-slate-50/60")
    : "border-slate-200 bg-slate-50/40";

  if (loading) {
    return (
      <div className={`rounded-xl border ${borderClass} px-4 py-4`}>
        <div className="flex items-center gap-2.5">
          <Loader2 size={15} className="animate-spin text-indigo-500 shrink-0" />
          <p className="text-sm text-slate-600">Analyzing fit for your organization…</p>
        </div>
      </div>
    );
  }

  if (!analysis && !error) return null;

  if (error && !analysis) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">{error}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border ${borderClass} px-4 py-4 space-y-3`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-indigo-500" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            AI Fit Analysis
          </span>
          {analysis?.cached && (
            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
              cached
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="text-slate-400 hover:text-indigo-600 transition-colors"
          title="Refresh analysis"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Summary */}
      {analysis?.whyMatch && (
        <p className="text-sm text-slate-700 leading-relaxed">{analysis.whyMatch}</p>
      )}
      {analysis?.summary && analysis.summary !== analysis.whyMatch && (
        <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
      )}

      {/* Strengths + risks inline */}
      {(analysis?.strengths?.length > 0 || analysis?.risks?.length > 0) && (
        <div className="space-y-1.5">
          {analysis.strengths?.slice(0, 2).map((s: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5">
              <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600">{s}</span>
            </div>
          ))}
          {analysis.risks?.slice(0, 1).map((r: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5">
              <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-slate-600">{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {analysis?.recommendation && (
        <p className="text-xs text-slate-500 border-t border-current/10 pt-2.5 italic">
          {analysis.recommendation}
        </p>
      )}
    </div>
  );
}

// ── Decision Banner ───────────────────────────────────────────────────────────

function DecisionBanner({ decision, onReopen }: any) {
  const config = {
    PURSUE:  { icon: CheckCircle,  color: "bg-green-50 border-green-200 text-green-800", label: "Pursuing this grant" },
    HOLD:    { icon: PauseCircle,  color: "bg-amber-50 border-amber-200 text-amber-800", label: "On hold" },
    DECLINE: { icon: XCircle,      color: "bg-red-50 border-red-200 text-red-700",       label: "Declined" },
  };
  const c = config[decision.decision as keyof typeof config];
  const Icon = c.icon;
  return (
    <div className={`rounded-lg border p-3.5 ${c.color}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} />
          <span className="font-semibold text-sm">{c.label}</span>
          <span className="text-xs opacity-60">
            · {decision.decidedBy?.name} · {formatDate(decision.decidedAt)}
          </span>
        </div>
        <button onClick={onReopen} className="text-xs underline opacity-50 hover:opacity-80">
          Change
        </button>
      </div>
      {decision.reason && (
        <p className="text-sm mt-1.5 opacity-75">{decision.reason}</p>
      )}
    </div>
  );
}

// ── Decision Modal ────────────────────────────────────────────────────────────

function DecisionModal({ open, onClose, onDecide, existing }: any) {
  const [decision, setDecision] = useState(existing?.decision || "PURSUE");
  const [reason, setReason] = useState(existing?.reason || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onDecide(decision, reason);
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Record a decision">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Decision"
          options={[
            { value: "PURSUE", label: "Pursue — start the application" },
            { value: "HOLD",   label: "Hold — revisit later" },
            { value: "DECLINE", label: "Not interested — skip this one" },
          ]}
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        />
        <Textarea
          label="Reason (required)"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why did you make this decision?"
          className="min-h-[90px]"
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save decision</Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function MetaField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    NEEDS_REVIEW:     "bg-amber-100 text-amber-700",
    UNDER_EVALUATION: "bg-blue-100 text-blue-700",
    GO:               "bg-green-100 text-green-700",
    HOLD:             "bg-slate-100 text-slate-600",
    NO_GO:            "bg-red-100 text-red-600",
    ARCHIVED:         "bg-slate-100 text-slate-400",
  };
  return (
    <Badge className={colors[status] ?? "bg-slate-100 text-slate-600"}>
      {STATUS_LABELS[status] ?? status.replace("_", " ")}
    </Badge>
  );
}
