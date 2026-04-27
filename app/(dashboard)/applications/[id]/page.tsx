import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { ApplicationDetail } from "@/components/applications/application-detail";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const [app, users] = await Promise.all([
    db.application.findUnique({
      where: { id },
      include: {
        opportunity: { include: { donor: true } },
        donor: true,
        owner: true,
        collaborators: { include: { user: true } },
        stageHistory: { include: { enteredBy: true }, orderBy: { enteredAt: "asc" } },
        tasks: { include: { assignee: true }, orderBy: [{ priority: "asc" }, { dueDate: "asc" }] },
        readinessGaps: { orderBy: [{ severity: "asc" }, { createdAt: "asc" }] },
        appNotes: { include: { author: true }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] },
        appAttachments: { orderBy: { createdAt: "desc" } },
        activityLogs: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!app) notFound();
  return <ApplicationDetail app={app} users={users} currentUserId={session.user?.id || ""} />;
}
