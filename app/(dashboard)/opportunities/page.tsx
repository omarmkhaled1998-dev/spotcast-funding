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

  const [opportunities, total, donors, realOppCount] = await Promise.all([
    db.opportunity.findMany({
      where,
      include: { donor: true, decision: true },
      orderBy: [{ urgencyLevel: "asc" }, { deadlineDate: "asc" }],
      take: PAGE_SIZE,
      skip,
    }),
    db.opportunity.count({ where }),
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
