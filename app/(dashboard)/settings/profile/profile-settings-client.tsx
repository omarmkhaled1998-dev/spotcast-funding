"use client";
import { useState, useTransition, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveOrgProfile, saveUserProfile } from "@/lib/actions/profiles";
import { CheckCircle, Upload, FileText, Trash2, Loader2, AlertCircle } from "lucide-react";

// ── Constants ───────────────────────────────────────────────────────────────

const THEMATIC_OPTIONS = [
  "Media & Journalism",
  "Human Rights",
  "Environment & Climate",
  "Education",
  "Health",
  "Democracy & Governance",
  "Economic Development",
  "Gender & Women's Rights",
  "Youth & Children",
  "Culture & Arts",
  "Technology & Innovation",
  "Humanitarian Aid",
  "Refugees & Migration",
];

const REGION_OPTIONS = [
  "Egypt",
  "Jordan",
  "Lebanon",
  "Palestine",
  "Tunisia",
  "Morocco",
  "Libya",
  "Iraq",
  "Syria",
  "Yemen",
  "Saudi Arabia",
  "UAE",
  "Kuwait",
  "Algeria",
  "Sudan",
  "Regional (MENA)",
  "Global",
];

const ORG_TYPES = [
  "Non-Governmental Organization (NGO)",
  "Media Organization",
  "Foundation",
  "Think Tank / Research Institute",
  "Community Organization",
  "Social Enterprise",
  "Academic Institution",
  "Other",
];

// ── ChipSelect ───────────────────────────────────────────────────────────────

function ChipSelect({
  name,
  options,
  selected,
  onChange,
  max,
}: {
  name: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            {active && <CheckCircle size={10} className="inline mr-1" />}
            {opt}
          </button>
        );
      })}
      {selected.map((s) => (
        <input key={s} type="hidden" name={name} value={s} />
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

interface OrgProfileData {
  orgType: string;
  mission: string;
  vision: string;
  previousWork: string;
  contextDocuments: string;
  docExtracts: string;
  thematicAreas: string[];
  geography: string[];
  fundingRangeMin?: number;
  fundingRangeMax?: number;
  website: string;
  registrationCountry: string;
}

interface UserProfileData {
  name: string;
  location: string;
  region: string;
  thematicInterests: string[];
  geography: string[];
  keywords: string;
  bio: string;
  linkedinUrl: string;
}

interface Props {
  wsType: "ORG" | "INDIVIDUAL";
  workspaceName: string;
  userName: string;
  orgProfile: OrgProfileData | null;
  userProfile: UserProfileData | null;
}

// ── Main component ─────────────────────────────────────────────────────────

export function ProfileSettingsClient({
  wsType,
  workspaceName,
  userName,
  orgProfile,
  userProfile,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // ORG state
  const [thematicAreas, setThematicAreas] = useState<string[]>(
    orgProfile?.thematicAreas ?? []
  );
  const [orgGeo, setOrgGeo] = useState<string[]>(orgProfile?.geography ?? []);

  // INDIVIDUAL state
  const [thematicInterests, setThematicInterests] = useState<string[]>(
    userProfile?.thematicInterests ?? []
  );
  const [userGeo, setUserGeo] = useState<string[]>(userProfile?.geography ?? []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result =
        wsType === "ORG"
          ? await saveOrgProfile(form)
          : await saveUserProfile(form);

      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  if (wsType === "ORG") {
    return (
      <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Org type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Organization type
          </label>
          <select
            name="orgType"
            defaultValue={orgProfile?.orgType ?? ""}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select type…</option>
            {ORG_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Mission */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Mission statement
            <span className="ml-1 font-normal text-slate-400">(used for AI matching)</span>
          </label>
          <textarea
            name="mission"
            rows={3}
            defaultValue={orgProfile?.mission ?? ""}
            placeholder={`Briefly describe ${workspaceName}'s mission and what you do…`}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        </div>

        {/* Vision */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Vision statement
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            name="vision"
            rows={2}
            defaultValue={orgProfile?.vision ?? ""}
            placeholder="The long-term change or future state your organization is working toward…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        </div>

        {/* Previous work / portfolio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Previous work &amp; portfolio
            <span className="ml-1 font-normal text-slate-400">(used by AI as reference context)</span>
          </label>
          <textarea
            name="previousWork"
            rows={5}
            defaultValue={orgProfile?.previousWork ?? ""}
            placeholder={`Describe notable projects, programs, or campaigns ${workspaceName} has completed. Include names, dates, outcomes, and any funders. The more detail you provide, the better the AI can match and write on your behalf.`}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Example: "2022–2023: Managed a $150k USAID-funded media literacy program across 3 governorates, reaching 4,200 youth. Partner: UNESCO Cairo."
          </p>
        </div>

        {/* Context documents */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Reference documents
            <span className="ml-1 font-normal text-slate-400">(paste key content for AI analysis)</span>
          </label>
          <textarea
            name="contextDocuments"
            rows={6}
            defaultValue={orgProfile?.contextDocuments ?? ""}
            placeholder="Paste excerpts from your annual reports, strategy documents, organizational capacity statements, past proposals, or other documents you want the AI to reference when analyzing opportunities and drafting documents…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-y"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            The AI will use this as an analytical reference to assess if an opportunity fits your organization and to write more accurate proposals. Keep under 2,000 words for best results.
          </p>
        </div>

        {/* Thematic areas */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Thematic areas
            <span className="ml-1 font-normal text-slate-400">Select all that apply</span>
          </label>
          <ChipSelect
            name="thematicAreas"
            options={THEMATIC_OPTIONS}
            selected={thematicAreas}
            onChange={setThematicAreas}
          />
        </div>

        {/* Geography */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Geographic focus
          </label>
          <ChipSelect
            name="geography"
            options={REGION_OPTIONS}
            selected={orgGeo}
            onChange={setOrgGeo}
          />
        </div>

        {/* Funding range */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min grant size (USD)"
            name="fundingRangeMin"
            type="number"
            defaultValue={orgProfile?.fundingRangeMin ?? ""}
            placeholder="e.g. 10000"
            min={0}
          />
          <Input
            label="Max grant size (USD)"
            name="fundingRangeMax"
            type="number"
            defaultValue={orgProfile?.fundingRangeMax ?? ""}
            placeholder="e.g. 200000"
            min={0}
          />
        </div>

        {/* Website + country */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Website"
            name="website"
            type="url"
            defaultValue={orgProfile?.website ?? ""}
            placeholder="https://yourorg.org"
          />
          <Input
            label="Registration country"
            name="registrationCountry"
            type="text"
            defaultValue={orgProfile?.registrationCountry ?? ""}
            placeholder="e.g. Egypt"
          />
        </div>

        <SaveBar error={error} saved={saved} isPending={isPending} />
      </form>

      {/* Document uploads — outside the save form so uploads don't require Save */}
      <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/60 p-6 space-y-1">
        <h2 className="text-sm font-semibold text-slate-800 mb-1">AI reference documents</h2>
        <DocUploadSection
          initialDocs={(() => {
            try { return JSON.parse(orgProfile?.docExtracts ?? "[]"); } catch { return []; }
          })()}
        />
      </div>
    </>
    );
  }

  // ── INDIVIDUAL form ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Your full name"
        name="name"
        type="text"
        defaultValue={userProfile?.name ?? userName}
        required
        placeholder="Your name"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Location"
          name="location"
          type="text"
          defaultValue={userProfile?.location ?? ""}
          placeholder="Cairo, Egypt"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Region
          </label>
          <select
            name="region"
            defaultValue={userProfile?.region ?? ""}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select region…</option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Thematic interests */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Thematic interests
          <span className="ml-1 font-normal text-slate-400">Select all that apply</span>
        </label>
        <ChipSelect
          name="thematicInterests"
          options={THEMATIC_OPTIONS}
          selected={thematicInterests}
          onChange={setThematicInterests}
        />
      </div>

      {/* Geography */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Geographic focus
        </label>
        <ChipSelect
          name="geography"
          options={REGION_OPTIONS}
          selected={userGeo}
          onChange={setUserGeo}
        />
      </div>

      {/* Keywords */}
      <Input
        label="Keywords"
        name="keywords"
        type="text"
        defaultValue={userProfile?.keywords ?? ""}
        placeholder="investigative journalism, environment, digital rights…"
        hint="Comma-separated keywords used to match opportunities"
      />

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Short bio
          <span className="ml-1 font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={userProfile?.bio ?? ""}
          placeholder="A few sentences about your work and expertise…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
        />
      </div>

      <Input
        label="LinkedIn URL"
        name="linkedinUrl"
        type="url"
        defaultValue={userProfile?.linkedinUrl ?? ""}
        placeholder="https://linkedin.com/in/yourprofile"
      />

      <SaveBar error={error} saved={saved} isPending={isPending} />
    </form>
  );
}

// ── Document upload section ──────────────────────────────────────────────────

function DocUploadSection({ initialDocs }: { initialDocs: DocMeta[] }) {
  const [docs, setDocs] = useState<DocMeta[]>(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/profile/upload-doc", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { setError(data.error ?? "Upload failed"); break; }
        setDocs((prev) => [...prev, data.doc as DocMeta]);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  async function deleteDoc(id: string) {
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/profile/upload-doc?id=${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Delete failed"); return; }
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Could not delete. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const TYPE_ICON: Record<string, string> = {
    PDF: "📄",
    Word: "📝",
    Excel: "📊",
    PowerPoint: "📑",
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Upload documents
        <span className="ml-1 font-normal text-slate-400">
          (PDF, Word, Excel, PowerPoint — max 10 MB each)
        </span>
      </label>
      <p className="text-xs text-slate-400 mb-3">
        Text is extracted and fed to the AI when analysing opportunities or drafting documents.
        Upload annual reports, strategy papers, past proposals, or capacity statements.
      </p>

      {/* Drop zone / upload button */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
      >
        {uploading ? (
          <>
            <Loader2 size={22} className="animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">Extracting text…</p>
          </>
        ) : (
          <>
            <Upload size={22} className="text-slate-400" />
            <p className="text-sm font-medium text-slate-600">
              Click to upload or drag &amp; drop
            </p>
            <p className="text-xs text-slate-400">PDF · Word (.docx) · Excel · PowerPoint</p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={13} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Uploaded docs list */}
      {docs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5"
            >
              <span className="text-base leading-none">{TYPE_ICON[doc.type] ?? "📁"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700">{doc.name}</p>
                <p className="text-xs text-slate-400">
                  {doc.type} · {formatBytes(doc.size)} ·{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => deleteDoc(doc.id)}
                disabled={deleting === doc.id}
                className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Remove document"
              >
                {deleting === doc.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {docs.length === 0 && !uploading && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <FileText size={12} />
          No documents uploaded yet
        </p>
      )}
    </div>
  );
}

// ── Save bar ─────────────────────────────────────────────────────────────────

function SaveBar({
  error,
  saved,
  isPending,
}: {
  error: string;
  saved: boolean;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <div className="flex-1">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}
        {saved && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle size={14} />
            Profile saved
          </p>
        )}
      </div>
      <Button type="submit" isLoading={isPending} size="lg">
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
