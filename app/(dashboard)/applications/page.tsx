import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { ApplicationsBoard } from "@/components/applications/applications-board";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const [applications, users] = await Promise.all([
    db.application.findMany({
      where: { workspaceId },
      include: {
        opportunity: true,
        donor: true,
        owner: true,
        tasks: { where: { status: { not: "DONE" } } },
        readinessGaps: { where: { isResolved: false } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return <ApplicationsBoard applications={applications} users={users} />;
}
