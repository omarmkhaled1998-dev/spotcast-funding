"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const THEMATIC_OPTIONS = [
  "Community Media", "Journalism", "Media Development", "Media Freedom",
  "Youth", "Local Development", "Civil Society", "Democracy",
  "Human Rights", "Digital Media", "Community Development",
  "Freedom of Expression", "Investigative Journalism", "Media Literacy",
];

const GEO_OPTIONS = [
  "Lebanon", "MENA", "Jordan", "Palestine", "Syria", "Iraq",
  "Egypt", "Tunisia", "Morocco", "Global", "Arab World",
];

interface OpportunityFormProps {
  donors: { id: string; name: string }[];
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  defaultValues?: Record<string, unknown>;
}

export function OpportunityForm({ donors, onSubmit, onCancel, defaultValues }: OpportunityFormProps) {
  const [selectedThemes, setSelectedThemes] = useState<string[]>(
    (defaultValues?.thematicAreas as string[]) || []
  );
  const [selectedGeo, setSelectedGeo] = useState<string[]>(
    (defaultValues?.geography as string[]) || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleItem(arr: string[], setArr: (v: string[]) => void, item: string) {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    const data = new FormData(e.currentTarget);
    selectedThemes.forEach((t) => data.append("thematicAreas", t));
    selectedGeo.forEach((g) => data.append("geography", g));
    await onSubmit(data);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Title"
        name="title"
        required
        placeholder="Call for Proposals: Community Media..."
        defaultValue={defaultValues?.title as string}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Donor"
          name="donorId"
          placeholder="Select donor..."
          options={donors.map((d) => ({ value: d.id, label: d.name }))}
          defaultValue={defaultValues?.donorId as string}
        />
        <Select
          label="Application Type"
          name="applicationType"
          placeholder="Select type..."
          options={[
            { value: "OPEN", label: "Open Call" },
            { value: "EOI", label: "Expression of Interest" },
            { value: "CONCEPT_NOTE", label: "Concept Note" },
            { value: "RFA", label: "Request for Applications" },
            { value: "RFP", label: "Request for Proposals" },
            { value: "INVITED", label: "Invited" },
            { value: "OTHER", label: "Other" },
          ]}
          defaultValue={defaultValues?.applicationType as string}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Deadline Date"
          name="deadlineDate"
          type="date"
          defaultValue={defaultValues?.deadlineDate as string}
        />
        <Select
          label="Urgency"
          name="urgencyLevel"
          options={[
            { value: "CRITICAL", label: "Critical" },
            { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" },
            { value: "LOW", label: "Low" },
          ]}
          defaultValue={(defaultValues?.urgencyLevel as string) || "MEDIUM"}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Min Funding (USD)"
          name="fundingAmountMin"
          type="number"
          placeholder="50000"
          defaultValue={defaultValues?.fundingAmountMin as string}
        />
        <Input
          label="Max Funding (USD)"
          name="fundingAmountMax"
          type="number"
          placeholder="200000"
          defaultValue={defaultValues?.fundingAmountMax as string}
        />
        <Select
          label="Currency"
          name="currency"
          options={[
            { value: "USD", label: "USD" },
            { value: "EUR", label: "EUR" },
            { value: "GBP", label: "GBP" },
          ]}
          defaultValue={(defaultValues?.currency as string) || "USD"}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">Thematic Areas</label>
        <div className="flex flex-wrap gap-2">
          {THEMATIC_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleItem(selectedThemes, setSelectedThemes, t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedThemes.includes(t)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 text-slate-600 hover:border-indigo-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 block mb-2">Geographic Coverage</label>
        <div className="flex flex-wrap gap-2">
          {GEO_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleItem(selectedGeo, setSelectedGeo, g)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedGeo.includes(g)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 text-slate-600 hover:border-indigo-400"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Source URL"
        name="sourceUrl"
        type="url"
        placeholder="https://..."
        defaultValue={defaultValues?.sourceUrl as string}
      />

      <Textarea
        label="Eligibility Summary"
        name="eligibilitySummary"
        placeholder="Who is eligible? Key requirements..."
        defaultValue={defaultValues?.eligibilitySummary as string}
      />

      <Textarea
        label="Summary / Description"
        name="summary"
        placeholder="Brief description of the opportunity..."
        defaultValue={defaultValues?.summary as string}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Language Requirement"
          name="languageRequirement"
          placeholder="English, Arabic..."
          defaultValue={defaultValues?.languageRequirement as string}
        />
        <Select
          label="Partner Required"
          name="partnerRequired"
          options={[
            { value: "false", label: "No" },
            { value: "true", label: "Yes" },
          ]}
          defaultValue={String(defaultValues?.partnerRequired || "false")}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Save Opportunity
        </Button>
      </div>
    </form>
  );
}
