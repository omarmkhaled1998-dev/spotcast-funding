"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDonor } from "@/lib/actions/donors";
import { formatDate, formatCurrency, parseJsonArray } from "@/lib/utils";
import { Plus, Globe, Users } from "lucide-react";
import type { Donor } from "@/app/generated/prisma/client";

const RELATIONSHIP_COLORS: Record<string, string> = {
  NONE: "bg-slate-200",
  AWARE: "bg-slate-400",
  CONTACTED: "bg-blue-400",
  ACTIVE: "bg-green-500",
  STRONG: "bg-green-700",
};

const RELATIONSHIP_LABELS: Record<string, string> = {
  NONE: "No relationship",
  AWARE: "Aware",
  CONTACTED: "Contacted",
  ACTIVE: "Active",
  STRONG: "Strong",
};

export function DonorsClient({ donors }: { donors: (Donor & { _count: { opportunities: number; applications: number }; contacts: any[] })[] }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [, startTransition] = useTransition();

  const filtered = donors.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && d.type !== typeFilter) return false;
    return true;
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await createDonor(data);
      setShowForm(false);
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Donors</h1>
          <p className="text-xs text-slate-500">{donors.length} donors · {filtered.length} shown</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus size={14} /> Add Donor
        </Button>
      </div>

      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white">
        <input
          type="text"
          placeholder="Search donors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="BILATERAL">Bilateral</option>
          <option value="MULTILATERAL">Multilateral</option>
          <option value="FOUNDATION">Foundation</option>
          <option value="NGO">NGO</option>
          <option value="GOVERNMENT">Government</option>
          <option value="PRIVATE">Private</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users size={32} className="mb-3" />
            <p className="text-sm">No donors found.</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
              Add your first donor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filtered.map((donor) => (
              <Link key={donor.id} href={`/donors/${donor.id}`}>
                <div className="rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-slate-800 text-sm">{donor.name}</h3>
                        <div
                          className={`h-2 w-2 rounded-full ${RELATIONSHIP_COLORS[donor.relationshipStrength]}`}
                          title={RELATIONSHIP_LABELS[donor.relationshipStrength]}
                        />
                        <span className="text-xs text-slate-400">{RELATIONSHIP_LABELS[donor.relationshipStrength]}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Badge variant="slate" className="text-xs">{donor.type}</Badge>
                        {donor.countryOfOrigin && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Globe size={11} /> {donor.countryOfOrigin}
                          </span>
                        )}
                        {(donor.fundingRangeMin || donor.fundingRangeMax) && (
                          <span className="text-xs text-slate-500">
                            {formatCurrency(donor.fundingRangeMin)} – {formatCurrency(donor.fundingRangeMax)}
                          </span>
                        )}
                      </div>
                      {donor.focusAreas && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {parseJsonArray(donor.focusAreas).slice(0, 3).map((f) => (
                            <span key={f} className="text-xs text-slate-400">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-slate-500">{donor._count.opportunities} opportunities</p>
                      <p className="text-xs text-slate-500">{donor._count.applications} applications</p>
                      {donor.lastInteractionDate && (
                        <p className="text-xs text-slate-400 mt-1">Last: {formatDate(donor.lastInteractionDate)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Donor" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Name" name="name" required placeholder="European Endowment for Democracy" />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              name="type"
              options={[
                { value: "BILATERAL", label: "Bilateral" },
                { value: "MULTILATERAL", label: "Multilateral" },
                { value: "FOUNDATION", label: "Foundation" },
                { value: "NGO", label: "NGO" },
                { value: "GOVERNMENT", label: "Government" },
                { value: "PRIVATE", label: "Private" },
                { value: "OTHER", label: "Other" },
              ]}
              defaultValue="FOUNDATION"
            />
            <Select
              label="Relationship Strength"
              name="relationshipStrength"
              options={[
                { value: "NONE", label: "No relationship" },
                { value: "AWARE", label: "Aware of us" },
                { value: "CONTACTED", label: "Contacted" },
                { value: "ACTIVE", label: "Active" },
                { value: "STRONG", label: "Strong" },
              ]}
              defaultValue="NONE"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Website" name="website" type="url" placeholder="https://..." />
            <Input label="Country of Origin" name="countryOfOrigin" placeholder="Germany" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Grant (USD)" name="fundingRangeMin" type="number" placeholder="50000" />
            <Input label="Max Grant (USD)" name="fundingRangeMax" type="number" placeholder="300000" />
          </div>
          <Textarea label="Preferred Framing" name="preferredFraming" placeholder="How does this donor prefer to see SpotCast's work framed?" />
          <Textarea label="Notes" name="notes" placeholder="Internal notes about this donor..." />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Save Donor</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
