import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { OpportunitiesClient } from "@/components/opportunities/opportunities-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; fit?: string; q?: string; page?: string; scanning?: string }>;
}) {
  let ctx;
  try {
    ctx = await getWorkspaceContext();
  } catch {
    redirect("/login");
  }
  const { workspaceId } = ctx;

  const params = await searchParams;
  const { status, fit, q } = params;
  const scanning = params.scanning === "1";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = { workspaceId };
  if (status) where.status = status;
  if (fit) where.fitLabel = fit;
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [allOpportunities, donors, realOppCount] = await Promise.all([
    db.opportunity.findMany({
      where,
      include: { donor: true, decision: true },
    }),
    db.donor.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    // Count non-demo opportunities to detect "showing demos only" state
    db.opportunity.count({
      where: { workspaceId, NOT: { externalId: { startsWith: "demo:" } } },
    }),
  ]);

  // In-memory sort: stale no-deadline opps (published >30 days ago) sink to bottom
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sorted = [...allOpportunities].sort((a, b) => {
    const aStale = !a.deadlineDate && !!a.foundAt && a.foundAt < thirtyDaysAgo;
    const bStale = !b.deadlineDate && !!b.foundAt && b.foundAt < thirtyDaysAgo;
    // Stale opps always go after non-stale
    if (aStale && !bStale) return 1;
    if (!aStale && bStale) return -1;
    // Within same group: highest score first
    const scoreA = a.suitabilityScore ?? -1;
    const scoreB = b.suitabilityScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;
    // Tie-break: closest deadline first (null deadline goes last)
    const dateA = a.deadlineDate ? a.deadlineDate.getTime() : Infinity;
    const dateB = b.deadlineDate ? b.deadlineDate.getTime() : Infinity;
    return dateA - dateB;
  });

  const total = sorted.length;
  const opportunities = sorted.slice(skip, skip + PAGE_SIZE);

  const showDemoBanner = realOppCount === 0 && total > 0;

  return (
    <OpportunitiesClient
      opportunities={opportunities}
      donors={donors}
      total={total}
      page={page}
      pageSize={PAGE_SIZE}
      filters={{ status: status ?? "", fit: fit ?? "", q: q ?? "" }}
      scanning={scanning}
      showDemoBanner={showDemoBanner}
    />
  );
}
