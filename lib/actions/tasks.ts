"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import type { TaskStatus, Priority } from "@/app/generated/prisma/client";

export async function createTask(applicationId: string, data: FormData) {
  const { workspaceId, userId } = await getWorkspaceContext();

  // Verify application belongs to workspace
  await db.application.findFirstOrThrow({ where: { id: applicationId, workspaceId } });

  await db.task.create({
    data: {
      applicationId,
      workspaceId,
      title: data.get("title") as string,
      assigneeId: (data.get("assigneeId") as string) || null,
      dueDate: data.get("dueDate") ? new Date(data.get("dueDate") as string) : null,
      priority: (data.get("priority") as Priority) || "MEDIUM",
      notes: (data.get("notes") as string) || null,
      createdById: userId,
    },
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { workspaceId } = await getWorkspaceContext();

  // Verify task belongs to workspace
  await db.task.findFirstOrThrow({ where: { id: taskId, workspaceId } });

  await db.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/applications");
  return { success: true };
}

export async function updateTask(taskId: string, data: FormData) {
  const { workspaceId } = await getWorkspaceContext();
  await db.task.findFirstOrThrow({ where: { id: taskId, workspaceId } });

  await db.task.update({
    where: { id: taskId },
    data: {
      title: data.get("title") as string,
      assigneeId: (data.get("assigneeId") as string) || null,
      dueDate: data.get("dueDate") ? new Date(data.get("dueDate") as string) : null,
      priority: (data.get("priority") as Priority) || "MEDIUM",
      notes: (data.get("notes") as string) || null,
    },
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const { workspaceId } = await getWorkspaceContext();
  await db.task.findFirstOrThrow({ where: { id: taskId, workspaceId } });
  await db.task.delete({ where: { id: taskId } });
  revalidatePath("/tasks");
  revalidatePath("/applications");
  return { success: true };
}
