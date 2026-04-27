import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { notFound, redirect } from "next/navigation";
import { OpportunityDetail } from "@/components/opportunities/opportunity-detail";
import { parseJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const { id } = await params;

  const ttlCutoff = new Date();
  ttlCutoff.setDate(ttlCutoff.getDate() - 7);

  const [opp, donors, users, latestAnalysis] = await Promise.all([
    db.opportunity.findFirst({
      where: { id, workspaceId },
      include: {
        donor: true,
        decision: { include: { decidedBy: true } },
        oppNotes: { include: { author: true }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] },
        oppAttachments: { orderBy: { createdAt: "desc" } },
        scoringResults: { orderBy: { scoredAt: "desc" }, take: 1 },
        application: {
          include: {
            owner: true,
            tasks: { where: { status: { not: "DONE" } }, take: 5 },
          },
        },
        activityLogs: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    }),
    db.donor.findMany({ where: { workspaceId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.opportunityAnalysis.findFirst({
      where: { opportunityId: id, workspaceId, createdAt: { gte: ttlCutoff } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!opp) notFound();

  const aiAnalysis = latestAnalysis
    ? {
        id: latestAnalysis.id,
        aiScore: latestAnalysis.aiScore,
        fitLabel: latestAnalysis.fitLabel,
        summary: latestAnalysis.summary ?? "",
        whyMatch: latestAnalysis.whyMatch ?? "",
        strengths: parseJsonArray(latestAnalysis.strengths),
        risks: parseJsonArray(latestAnalysis.risks),
        recommendation: latestAnalysis.recommendation ?? "",
        cached: true,
      }
    : null;

  return (
    <OpportunityDetail
      opp={opp}
      donors={donors}
      users={users}
      currentUserId={session.user?.id || ""}
      aiAnalysis={aiAnalysis}
    />
  );
}
