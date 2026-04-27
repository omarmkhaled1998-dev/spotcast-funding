"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateDocument } from "@/lib/actions/ai";
import type { WritingTaskType } from "@/lib/ai/write";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  RefreshCw,
  FileText,
  Mail,
  User,
  Calculator,
  ClipboardCheck,
  BookOpen,
} from "lucide-react";

// ── Task options ──────────────────────────────────────────────────────────────

const TASK_OPTIONS: {
  value: WritingTaskType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
}[] = [
  {
    value: "CONCEPT_NOTE_DRAFT",
    label: "Concept Note",
    icon: BookOpen,
    description: "2-3 page concept note for initial submission",
  },
  {
    value: "COVER_LETTER",
    label: "Cover Letter",
    icon: Mail,
    description: "Short intro letter to accompany the application",
  },
  {
    value: "PROPOSAL_DRAFT",
    label: "Full Proposal",
    icon: FileText,
    description: "Complete grant proposal with all sections",
  },
  {
    value: "ELIGIBILITY_CHECK",
    label: "Eligibility Check",
    icon: ClipboardCheck,
    description: "Assess your eligibility for this opportunity",
  },
  {
    value: "BIO",
    label: "Org Bio",
    icon: User,
    description: "150-word organizational bio for applications",
  },
  {
    value: "BUDGET_NARRATIVE",
    label: "Budget Narrative",
    icon: Calculator,
    description: "Written justification for budget line items",
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  opportunityId?: string;
  applicationId?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function WritingPanel({ opportunityId, applicationId }: Props) {
  const [selectedTask, setSelectedTask] = useState<WritingTaskType>("CONCEPT_NOTE_DRAFT");
  const [instructions, setInstructions] = useState("");
  const [language, setLanguage] = useState("English");
  const [showDropdown, setShowDropdown] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tokenInfo, setTokenInfo] = useState<{
    inputTokens: number;
    outputTokens: number;
    costUsdCents: number;
    model: string;
    cached: boolean;
  } | null>(null);

  const selected = TASK_OPTIONS.find((t) => t.value === selectedTask)!;
  const SelectedIcon = selected.icon;

  function handleGenerate(regenerate = false) {
    setError("");
    if (regenerate) setOutput("");

    startTransition(async () => {
      const result = await generateDocument(
        selectedTask,
        opportunityId,
        applicationId,
        instructions || undefined,
        language
      );

      if ("error" in result) {
        setError(result.error);
      } else {
        setOutput(result.content);
        setTokenInfo({
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costUsdCents: result.costUsdCents,
          model: result.model,
          cached: result.cached,
        });
      }
    });
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Task selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-left hover:border-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <SelectedIcon size={15} className="text-indigo-500" />
            <div>
              <p className="font-medium text-slate-800">{selected.label}</p>
              <p className="text-xs text-slate-400">{selected.description}</p>
            </div>
          </div>
          <ChevronDown
            size={15}
            className={`text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
            {TASK_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = opt.value === selectedTask;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedTask(opt.value);
                    setShowDropdown(false);
                    setOutput("");
                    setTokenInfo(null);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-slate-50 transition-colors ${
                    active ? "bg-indigo-50 text-indigo-700" : "text-slate-700"
                  }`}
                >
                  <Icon size={14} className={active ? "text-indigo-500" : "text-slate-400"} />
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Language selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-slate-600 shrink-0">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
        >
          <option value="English">English</option>
          <option value="Arabic">Arabic (العربية)</option>
          <option value="French">French</option>
        </select>
      </div>

      {/* Optional instructions */}
      <Textarea
        label="Additional instructions (optional)"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="E.g. Focus on youth empowerment angle. Keep budget section brief. Emphasize previous EJN projects."
        className="min-h-[64px] text-sm"
      />

      {/* Generate button */}
      <Button
        onClick={() => handleGenerate(false)}
        isLoading={isPending}
        className="w-full"
        disabled={isPending}
      >
        <Sparkles size={14} />
        {isPending ? "Writing…" : output ? "Regenerate" : `Generate ${selected.label}`}
      </Button>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
      )}

      {/* Output */}
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Output</span>
              {tokenInfo && (
                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {tokenInfo.cached ? "cached" : `${tokenInfo.inputTokens + tokenInfo.outputTokens} tokens · $${(tokenInfo.costUsdCents / 100).toFixed(3)}`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleGenerate(true)}
                className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                title="Regenerate"
              >
                <RefreshCw size={11} />
                Redo
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[480px] overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
