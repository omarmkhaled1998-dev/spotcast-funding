import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const tasks = await db.task.findMany({
    where: { workspaceId, status: { not: "DONE" } },
    include: {
      assignee: true,
      application: {
        include: { opportunity: true, donor: true },
      },
    },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
  });

  return <TasksPageClient tasks={tasks} currentUserId={session.user?.id || ""} />;
}
