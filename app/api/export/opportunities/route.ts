/**
 * CSV export for opportunities.
 *
 * GET /api/export/opportunities
 *     ?status=GO&fit=SUITABLE&q=search    (all optional filters)
 *
 * Returns a CSV file download.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { parseJsonArray } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const fit = searchParams.get("fit");
  const q = searchParams.get("q");

  const where: Record<string, unknown> = { workspaceId };
  if (status) where.status = status;
  if (fit) where.fitLabel = fit;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const opps = await db.opportunity.findMany({
    where,
    include: { donor: { select: { name: true } } },
    orderBy: [{ suitabilityScore: "desc" }, { deadlineDate: "asc" }],
    take: 5000, // safety cap
  });

  // Build CSV
  const headers = [
    "Title",
    "Donor",
    "Status",
    "Fit Label",
    "Score",
    "Deadline",
    "Funding Min (USD)",
    "Funding Max (USD)",
    "Thematic Areas",
    "Geography",
    "Application Type",
    "Language",
    "Partner Required",
    "Source URL",
    "Found At",
  ];

  const rows = opps.map((o) => [
    csvCell(o.title),
    csvCell(o.donor?.name ?? ""),
    csvCell(o.status),
    csvCell(o.fitLabel ?? ""),
    csvCell(String(o.suitabilityScore ?? "")),
    csvCell(o.deadlineDate ? o.deadlineDate.toISOString().split("T")[0] : ""),
    csvCell(String(o.fundingAmountMin ?? "")),
    csvCell(String(o.fundingAmountMax ?? "")),
    csvCell(parseJsonArray(o.thematicAreas).join("; ")),
    csvCell(parseJsonArray(o.geography).join("; ")),
    csvCell(o.applicationType ?? ""),
    csvCell(o.languageRequirement ?? ""),
    csvCell(o.partnerRequired ? "Yes" : "No"),
    csvCell(o.sourceUrl ?? ""),
    csvCell(o.foundAt ? o.foundAt.toISOString().split("T")[0] : ""),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const filename = `opportunities-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
