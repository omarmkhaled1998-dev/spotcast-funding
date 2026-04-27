"use client";
import { useState, useTransition } from "react";
import { createNote } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const NOTE_TYPES = [
  { value: "GENERAL", label: "General Note" },
  { value: "STRATEGIC", label: "Strategic" },
  { value: "RISK", label: "Risk" },
  { value: "LESSON_LEARNED", label: "Lesson Learned" },
  { value: "DONOR_INTELLIGENCE", label: "Donor Intelligence" },
  { value: "DECISION_RATIONALE", label: "Decision Rationale" },
];

export function AddNoteForm({
  subjectType,
  subjectId,
}: {
  subjectType: "opportunity" | "application" | "donor";
  subjectId: string;
}) {
  const [body, setBody] = useState("");
  const [noteType, setNoteType] = useState("GENERAL");
  const [isPinned, setIsPinned] = useState(false);
  const [, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    const data = new FormData();
    data.set("body", body);
    data.set("noteType", noteType);
    data.set("isPinned", String(isPinned));
    startTransition(async () => {
      await createNote(subjectType, subjectId, data);
      setBody("");
      setIsPinned(false);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <Textarea
            placeholder="Add a note..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[60px]"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Select
          options={NOTE_TYPES}
          value={noteType}
          onChange={(e) => setNoteType(e.target.value)}
          className="w-44"
        />
        <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="rounded"
          />
          Pin note
        </label>
        <Button type="submit" size="sm" disabled={!body.trim()}>
          Add Note
        </Button>
      </div>
    </form>
  );
}
