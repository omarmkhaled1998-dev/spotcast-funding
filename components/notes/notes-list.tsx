"use client";
import { useState, useTransition } from "react";
import { togglePinNote, deleteNote } from "@/lib/actions/notes";
import { formatRelative } from "@/lib/utils";
import { Pin, Trash2 } from "lucide-react";

const NOTE_TYPE_COLORS: Record<string, string> = {
  STRATEGIC: "bg-indigo-50 border-indigo-200",
  RISK: "bg-red-50 border-red-200",
  LESSON_LEARNED: "bg-green-50 border-green-200",
  DONOR_INTELLIGENCE: "bg-blue-50 border-blue-200",
  DECISION_RATIONALE: "bg-amber-50 border-amber-200",
  GENERAL: "bg-white border-slate-200",
};

const NOTE_TYPE_LABELS: Record<string, string> = {
  STRATEGIC: "Strategic",
  RISK: "Risk",
  LESSON_LEARNED: "Lesson Learned",
  DONOR_INTELLIGENCE: "Donor Intel",
  DECISION_RATIONALE: "Decision",
  GENERAL: "Note",
};

export function NotesList({ notes }: { notes: any[] }) {
  const [, startTransition] = useTransition();

  if (!notes.length) {
    return <p className="text-sm text-slate-400 text-center py-4">No notes yet.</p>;
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div
          key={note.id}
          className={`rounded-lg border p-4 ${NOTE_TYPE_COLORS[note.noteType] || "bg-white border-slate-200"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {note.isPinned && <Pin size={12} className="text-indigo-500" />}
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {NOTE_TYPE_LABELS[note.noteType] || note.noteType}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400">{note.author?.name || "Unknown"}</span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-400" suppressHydrationWarning>{formatRelative(note.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.body}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => startTransition(async () => { await togglePinNote(note.id); })}
                className={`p-1 rounded transition-colors ${note.isPinned ? "text-indigo-600 hover:text-indigo-800" : "text-slate-300 hover:text-slate-500"}`}
              >
                <Pin size={13} />
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this note?")) {
                    startTransition(async () => { await deleteNote(note.id); });
                  }
                }}
                className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
