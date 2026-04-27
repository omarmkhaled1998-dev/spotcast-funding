"use client";
import { useState } from "react";
import Link from "next/link";
import { FileText, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const DOC_TYPE_COLORS: Record<string, string> = {
  CONCEPT_NOTE: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-indigo-100 text-indigo-700",
  BUDGET: "bg-green-100 text-green-700",
  INSTITUTIONAL: "bg-purple-100 text-purple-700",
  CORRESPONDENCE: "bg-amber-100 text-amber-700",
  REPORT: "bg-cyan-100 text-cyan-700",
  TEMPLATE: "bg-pink-100 text-pink-700",
  REGISTRATION: "bg-orange-100 text-orange-700",
  OTHER: "bg-slate-100 text-slate-600",
};

interface Attachment {
  id: string;
  title: string | null;
  fileName: string;
  docType: string;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: string;
  isTemplate: boolean;
  uploadedBy: { name: string } | null;
  opportunity: { id: string; title: string } | null;
  application: { id: string; opportunity: { title: string } | null } | null;
  donor: { id: string; name: string } | null;
}

const ALL_DOC_TYPES = [
  "CONCEPT_NOTE", "PROPOSAL", "BUDGET", "INSTITUTIONAL",
  "CORRESPONDENCE", "REPORT", "TEMPLATE", "REGISTRATION", "OTHER",
];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function entityLabel(att: Attachment): { label: string; href: string } | null {
  if (att.opportunity) return { label: att.opportunity.title, href: `/opportunities/${att.opportunity.id}` };
  if (att.application) return {
    label: att.application.opportunity?.title ?? "Application",
    href: `/applications/${att.application.id}`,
  };
  if (att.donor) return { label: att.donor.name, href: `/donors/${att.donor.id}` };
  return null;
}

export function DocumentsClient({ attachments }: { attachments: Attachment[] }) {
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [showTemplates, setShowTemplates] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");

  const filtered = attachments.filter((a) => {
    if (typeFilter !== "ALL" && a.docType !== typeFilter) return false;
    if (showTemplates === true && !a.isTemplate) return false;
    if (showTemplates === false && a.isTemplate) return false;
    if (search && !a.fileName.toLowerCase().includes(search.toLowerCase()) &&
      !(a.title ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-slate-800">Documents</h1>
            <p className="text-xs text-slate-500">{attachments.length} total attachments</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={13} />
            <span>Filter:</span>
          </div>

          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-slate-200 rounded-md px-3 py-1.5 w-48 focus:outline-none focus:border-indigo-400"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-400"
          >
            <option value="ALL">All types</option>
            {ALL_DOC_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>

          <select
            value={showTemplates === null ? "all" : showTemplates ? "templates" : "regular"}
            onChange={(e) => {
              const v = e.target.value;
              setShowTemplates(v === "all" ? null : v === "templates");
            }}
            className="text-xs border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-indigo-400"
          >
            <option value="all">All docs</option>
            <option value="templates">Templates only</option>
            <option value="regular">Non-templates</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText size={40} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">No documents yet</p>
            <p className="text-xs mt-1">Attachments added to opportunities, applications, or donors will appear here.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">No documents match your filters.</p>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Document</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Linked to</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Size</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Uploaded</th>
                  <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((att) => {
                  const entity = entityLabel(att);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-800">{att.title || att.fileName}</p>
                            {att.title && att.title !== att.fileName && (
                              <p className="text-xs text-slate-400">{att.fileName}</p>
                            )}
                            {att.isTemplate && (
                              <Badge className="bg-pink-100 text-pink-700 text-[10px] mt-0.5">Template</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={DOC_TYPE_COLORS[att.docType] || DOC_TYPE_COLORS.OTHER}>
                          {att.docType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {entity ? (
                          <Link href={entity.href} className="text-indigo-600 hover:underline text-sm truncate max-w-[200px] block">
                            {entity.label}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatBytes(att.fileSize)}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(att.createdAt)}</td>
                      <td className="py-3 px-4 text-slate-500">{att.uploadedBy?.name || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
