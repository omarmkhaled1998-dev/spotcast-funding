"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import type { AlertFrequency } from "@/app/generated/prisma/client";

/**
 * Upsert the alert config for the current user in this workspace.
 * Each user gets one EmailAlert record per workspace.
 */
export async function saveAlertSettings(formData: FormData) {
  const { workspaceId, userId } = await getWorkspaceContext();

  const isActive = formData.get("isActive") === "true";
  const frequency = formData.get("frequency") as AlertFrequency;
  const minScore = Number(formData.get("minScore") ?? 60);
  const deadlineAlertDays = Number(formData.get("deadlineAlertDays") ?? 14);
  const emailAddress = formData.get("emailAddress") as string;

  if (!emailAddress) return { error: "Email address is required" };

  const alertData = { isActive, frequency, minScore, deadlineAlertDays, emailAddress };
  const existing = await db.emailAlert.findFirst({ where: { workspaceId, userId } });

  if (existing) {
    await db.emailAlert.update({ where: { id: existing.id }, data: alertData });
  } else {
    await db.emailAlert.create({ data: { workspaceId, userId, ...alertData } });
  }

  revalidatePath("/settings/alerts");
  return { success: true };
}

/**
 * Toggle a single alert on/off.
 */
export async function toggleAlert(alertId: string, isActive: boolean) {
  const { workspaceId } = await getWorkspaceContext();
  await db.emailAlert.updateMany({ where: { id: alertId, workspaceId }, data: { isActive } });
  revalidatePath("/settings/alerts");
  return { success: true };
}

/**
 * Delete an alert.
 */
export async function deleteAlert(alertId: string) {
  const { workspaceId } = await getWorkspaceContext();
  await db.emailAlert.deleteMany({ where: { id: alertId, workspaceId } });
  revalidatePath("/settings/alerts");
  return { success: true };
}

/**
 * Get current alert settings for the user.
 */
export async function getAlertSettings() {
  const { workspaceId, userId } = await getWorkspaceContext();
  return db.emailAlert.findFirst({
    where: { workspaceId, userId },
    include: {
      logs: { orderBy: { sentAt: "desc" }, take: 5 },
    },
  });
}
