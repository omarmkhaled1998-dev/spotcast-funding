import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { addDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  let workspaceId: string;
  let memberRole: string;
  try {
    const ctx = await getWorkspaceContext();
    workspaceId = ctx.workspaceId;
    memberRole = ctx.role as string;
  } catch {
    redirect("/login");
  }

  const params = await searchParams;
  let welcomeData: { workspaceName: string; role: string } | null = null;
  if (params.welcome === "1") {
    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });
    if (workspace) {
      welcomeData = { workspaceName: workspace.name, role: memberRole };
    }
  }

  const now = new Date();
  const in14Days = addDays(now, 14);

  const [
    urgentDeadlines,
    needsReview,
    activeApplications,
    overdueTasks,
    awaitingResponse,
    totalOpportunities,
    totalDonors,
    totalApplications,
    recentActivity,
  ] = await Promise.all([
    db.opportunity.findMany({
      where: {
        workspaceId,
        deadlineDate: { gte: now, lte: in14Days },
        status: { notIn: ["ARCHIVED", "NO_GO"] },
      },
      include: { donor: true, application: true },
      orderBy: { deadlineDate: "asc" },
      take: 10,
    }),

    db.opportunity.findMany({
      where: { workspaceId, status: "NEEDS_REVIEW" },
      include: { donor: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    db.application.findMany({
      where: {
        workspaceId,
        stage: { notIn: ["AWARDED", "REJECTED", "NO_RESPONSE", "WITHDRAWN"] },
      },
      include: { opportunity: true, donor: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),

    db.task.findMany({
      where: {
        workspaceId,
        dueDate: { lt: now },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: {
        assignee: true,
        application: { include: { opportunity: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),

    db.application.findMany({
      where: { workspaceId, stage: "SUBMITTED" },
      include: { opportunity: true, donor: true },
      orderBy: { submissionDate: "asc" },
    }),

    db.opportunity.count({ where: { workspaceId, status: { not: "ARCHIVED" } } }),
    db.donor.count({ where: { workspaceId } }),
    db.application.count({
      where: {
        workspaceId,
        stage: { notIn: ["AWARDED", "REJECTED", "NO_RESPONSE", "WITHDRAWN"] },
      },
    }),

    db.activityLog.findMany({
      where: { workspaceId },
      include: {
        user: true,
        opportunity: true,
        application: { include: { opportunity: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <>
      {welcomeData && (
        <WelcomeBanner
          workspaceName={welcomeData.workspaceName}
          role={welcomeData.role}
        />
      )}
      <DashboardClient
        urgentDeadlines={urgentDeadlines}
        needsReview={needsReview}
        activeApplications={activeApplications}
        overdueTasks={overdueTasks}
        awaitingResponse={awaitingResponse}
        stats={{ totalOpportunities, totalDonors, totalApplications, overdueTasks: overdueTasks.length }}
        recentActivity={recentActivity}
        userName={session.user?.name || ""}
      />
    </>
  );
}
