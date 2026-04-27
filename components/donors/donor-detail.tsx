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
import { addDonorContact, addRelationshipLog } from "@/lib/actions/donors";
import { formatDate, formatCurrency, parseJsonArray, STAGE_LABELS, STAGE_COLORS } from "@/lib/utils";
import { ChevronRight, Plus, ExternalLink } from "lucide-react";

const RELATIONSHIP_COLORS: Record<string, string> = {
  NONE: "bg-slate-200 text-slate-600",
  AWARE: "bg-slate-400 text-white",
  CONTACTED: "bg-blue-400 text-white",
  ACTIVE: "bg-green-500 text-white",
  STRONG: "bg-green-700 text-white",
};

export function DonorDetail({ donor, currentUserId }: { donor: any; currentUserId: string }) {
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "history" | "log" | "notes">("overview");
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [, startTransition] = useTransition();

  function handleAddContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await addDonorContact(donor.id, data);
      setShowContactForm(false);
    });
  }

  function handleAddLog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await addRelationshipLog(donor.id, data);
      setShowLogForm(false);
    });
  }

  const tabs = ["overview", "contacts", "history", "log", "notes"] as const;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
          <Link href="/donors" className="hover:text-indigo-600">Donors</Link>
          <ChevronRight size={12} />
          <span className="text-slate-600">{donor.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{donor.name}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <Badge variant="slate" className="text-xs">{donor.type}</Badge>
              <Badge className={RELATIONSHIP_COLORS[donor.relationshipStrength]}>
                {donor.relationshipStrength}
              </Badge>
              {donor.website && (
                <a href={donor.website} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowLogForm(true)}>
            <Plus size={13} /> Log Interaction
          </Button>
        </div>

        <div className="flex gap-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab === "log" ? "Relationship Log" : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-6 max-w-4xl">
            <Card>
              <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Field label="Country" value={donor.countryOfOrigin} />
                <Field label="Funding Range" value={
                  donor.fundingRangeMin || donor.fundingRangeMax
                    ? `${formatCurrency(donor.fundingRangeMin)} – ${formatCurrency(donor.fundingRangeMax)}`
                    : null
                } />
                <Field label="Typical Grant Duration" value={
                  donor.typicalGrantDurationMonths
                    ? `${donor.typicalGrantDurationMonths} months`
                    : null
                } />
                <Field label="Last Interaction" value={formatDate(donor.lastInteractionDate)} />
                {donor.focusAreas && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Focus Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parseJsonArray(donor.focusAreas).map((f: string) => (
                        <Badge key={f} variant="default" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {donor.geographicFocus && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Geographic Focus</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parseJsonArray(donor.geographicFocus).map((g: string) => (
                        <Badge key={g} variant="outline" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Preferred Framing</CardTitle></CardHeader>
              <CardContent>
                {donor.preferredFraming ? (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{donor.preferredFraming}</p>
                ) : (
                  <p className="text-sm text-slate-400">No framing notes yet. Add them to inform proposal drafting.</p>
                )}
              </CardContent>
            </Card>
            {donor.notes && (
              <Card className="col-span-2">
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{donor.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="max-w-2xl space-y-4">
            <Button size="sm" onClick={() => setShowContactForm(true)}>
              <Plus size={13} /> Add Contact
            </Button>
            {donor.contacts.map((c: any) => (
              <div key={c.id} className="rounded-lg border border-slate-200 p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{c.name}</p>
                    {c.title && <p className="text-xs text-slate-500">{c.title}</p>}
                    {c.email && <a href={`mailto:${c.email}`} className="text-xs text-indigo-600 hover:underline block mt-1">{c.email}</a>}
                    {c.phone && <p className="text-xs text-slate-500 mt-0.5">{c.phone}</p>}
                    {c.notes && <p className="text-xs text-slate-400 mt-2">{c.notes}</p>}
                  </div>
                  {c.isPrimary && <Badge variant="blue">Primary</Badge>}
                </div>
              </div>
            ))}
            {donor.contacts.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No contacts added yet.</p>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-3xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Opportunity</th>
                  <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Stage</th>
                  <th className="text-left py-2 pr-4 text-xs text-slate-500 font-medium uppercase">Result</th>
                  <th className="text-left py-2 text-xs text-slate-500 font-medium uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donor.applications.map((app: any) => (
                  <tr key={app.id}>
                    <td className="py-3 pr-4">
                      <Link href={`/applications/${app.id}`} className="text-indigo-600 hover:underline">
                        {app.opportunity?.title}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={STAGE_COLORS[app.stage]}>{STAGE_LABELS[app.stage]}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{app.result || "—"}</td>
                    <td className="py-3 text-slate-600">{formatCurrency(app.amountAwarded || app.amountRequested)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donor.applications.length === 0 && (
              <p className="text-sm text-slate-400 py-8 text-center">No applications with this donor yet.</p>
            )}
          </div>
        )}

        {activeTab === "log" && (
          <div className="max-w-2xl space-y-3">
            {donor.relationshipLogs.map((log: any) => (
              <div key={log.id} className="rounded-lg border border-slate-200 p-4 bg-white">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="blue" className="text-xs">{log.interactionType}</Badge>
                  <span className="text-xs text-slate-400">{formatDate(log.date)}</span>
                  <span className="text-xs text-slate-400">· {log.loggedBy?.name}</span>
                </div>
                {log.summary && <p className="text-sm text-slate-700">{log.summary}</p>}
              </div>
            ))}
            {donor.relationshipLogs.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No interactions logged yet.</p>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="max-w-2xl">
            <AddNoteForm subjectType="donor" subjectId={donor.id} />
            <div className="mt-4">
              <NotesList notes={donor.donorNotes} />
            </div>
          </div>
        )}
      </div>

      <Modal open={showContactForm} onClose={() => setShowContactForm(false)} title="Add Contact">
        <form onSubmit={handleAddContact} className="space-y-4">
          <Input label="Name" name="name" required placeholder="Jane Smith" />
          <Input label="Title" name="title" placeholder="Programme Officer" />
          <Input label="Email" name="email" type="email" placeholder="jane@donor.org" />
          <Input label="Phone" name="phone" placeholder="+49..." />
          <Textarea label="Notes" name="notes" placeholder="Context about this contact..." />
          <Select
            label="Primary Contact"
            name="isPrimary"
            options={[{ value: "false", label: "No" }, { value: "true", label: "Yes" }]}
            defaultValue="false"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowContactForm(false)}>Cancel</Button>
            <Button type="submit">Add Contact</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showLogForm} onClose={() => setShowLogForm(false)} title="Log Interaction">
        <form onSubmit={handleAddLog} className="space-y-4">
          <Select
            label="Type"
            name="interactionType"
            required
            options={[
              { value: "MEETING", label: "Meeting" },
              { value: "EMAIL", label: "Email" },
              { value: "CALL", label: "Call" },
              { value: "EVENT", label: "Event" },
              { value: "APPLICATION", label: "Application" },
              { value: "REPORT", label: "Report" },
              { value: "OTHER", label: "Other" },
            ]}
          />
          <Input label="Date" name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
          <Textarea label="Summary" name="summary" placeholder="What was discussed, decided, or sent..." />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowLogForm(false)}>Cancel</Button>
            <Button type="submit">Log Interaction</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}
