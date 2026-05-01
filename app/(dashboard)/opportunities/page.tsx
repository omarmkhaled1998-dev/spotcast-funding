import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { OpportunitiesClient } from "@/components/opportunities/opportunities-client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; fit?: string; q?: string; page?: string; scanning?: string; source?: string }>;
}) {
  let ctx;
  try {
    ctx = await getWorkspaceContext();
  } catch {
    redirect("/login");
  }
  const { workspaceId } = ctx;

  const params = await searchParams;
  const { status, fit, q, source } = params;
  const scanning = params.scanning === "1";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = { workspaceId };
  if (status) where.status = status;
  if (fit) where.fitLabel = fit;
  if (q) where.title = { contains: q, mode: "insensitive" };
  // Source filter: map friendly key → DB conditions
  if (source === "for9a") where.externalId = { startsWith: "for9a-" };
  else if (source === "ejn") where.externalId = { startsWith: "ejn-" };
  else if (source === "daleel") where.sourceUrl = { contains: "daleelmadani", mode: "insensitive" };
  else if (source === "manual") where.sourceType = "MANUAL";

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

  /**
   * Three-tier sort:
   *  Group 0 — has deadline            → score DESC, deadline ASC
   *  Group 1 — no deadline, recent     → score DESC  (≤ 30 days since found)
   *  Group 2 — no deadline, stale/old  → score DESC  (> 30 days or foundAt unknown)
   */
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sortGroup = (opp: (typeof allOpportunities)[0]): 0 | 1 | 2 => {
    if (opp.deadlineDate) return 0;                                              // has deadline
    if (opp.foundAt && opp.foundAt >= thirtyDaysAgo) return 1;                  // no deadline, fresh
    return 2;                                                                    // no deadline, stale
  };

  const sorted = [...allOpportunities].sort((a, b) => {
    const ga = sortGroup(a);
    const gb = sortGroup(b);
    if (ga !== gb) return ga - gb;                                               // group first
    const scoreA = a.suitabilityScore ?? -1;
    const scoreB = b.suitabilityScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;                               // score DESC
    const dateA = a.deadlineDate ? a.deadlineDate.getTime() : Infinity;
    const dateB = b.deadlineDate ? b.deadlineDate.getTime() : Infinity;
    return dateA - dateB;                                                        // deadline ASC
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
      filters={{ status: status ?? "", fit: fit ?? "", q: q ?? "", source: source ?? "" }}
      scanning={scanning}
      showDemoBanner={showDemoBanner}
    />
  );
}
