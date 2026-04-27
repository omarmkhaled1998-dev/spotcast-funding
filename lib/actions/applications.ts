"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import { computeReadinessGaps } from "@/lib/scoring";
import type { AppStage } from "@/app/generated/prisma/client";

export async function updateApplicationStage(id: string, stage: AppStage) {
  const { workspaceId, userId } = await getWorkspaceContext();

  const app = await db.application.findFirstOrThrow({ where: { id, workspaceId } });

  await db.application.update({ where: { id }, data: { stage } });

  await db.applicationStage.create({
    data: { applicationId: id, stage, enteredById: userId },
  });

  await db.activityLog.create({
    data: {
      workspaceId,
      userId,
      action: "stage_changed",
      applicationId: id,
      oldValue: JSON.stringify({ stage: app.stage }),
      newValue: JSON.stringify({ stage }),
    },
  });

  revalidatePath(`/applications/${id}`);
  revalidatePath("/applications");
  return { success: true };
}

export async function updateApplication(id: string, data: FormData) {
  const { workspaceId } = await getWorkspaceContext();

  await db.application.findFirstOrThrow({ where: { id, workspaceId } });

  await db.application.update({
    where: { id },
    data: {
      ownerId: (data.get("ownerId") as string) || null,
      internalDeadline: data.get("internalDeadline")
        ? new Date(data.get("internalDeadline") as string)
        : null,
      donorDeadline: data.get("donorDeadline")
        ? new Date(data.get("donorDeadline") as string)
        : null,
      amountRequested: data.get("amountRequested") ? Number(data.get("amountRequested")) : null,
      confidenceLevel: (data.get("confidenceLevel") as "MEDIUM") || "MEDIUM",
      blockers: (data.get("blockers") as string) || null,
      nextAction: (data.get("nextAction") as string) || null,
      nextActionDueDate: data.get("nextActionDueDate")
        ? new Date(data.get("nextActionDueDate") as string)
        : null,
    },
  });

  revalidatePath(`/applications/${id}`);
  revalidatePath("/applications");
  return { success: true };
}

export async function recordResult(
  id: string,
  result: "AWARDED" | "REJECTED" | "NO_RESPONSE" | "WITHDRAWN",
  amountAwarded?: number
) {
  const { workspaceId } = await getWorkspaceContext();
  await db.application.findFirstOrThrow({ where: { id, workspaceId } });

  const stageMap = {
    AWARDED: "AWARDED" as AppStage,
    REJECTED: "REJECTED" as AppStage,
    NO_RESPONSE: "NO_RESPONSE" as AppStage,
    WITHDRAWN: "WITHDRAWN" as AppStage,
  };

  await db.application.update({
    where: { id },
    data: {
      result,
      stage: stageMap[result],
      resultDate: new Date(),
      amountAwarded: amountAwarded || null,
    },
  });

  revalidatePath(`/applications/${id}`);
  revalidatePath("/applications");
  return { success: true };
}

export async function refreshReadinessGaps(applicationId: string) {
  const { workspaceId } = await getWorkspaceContext();

  const app = await db.application.findFirst({
    where: { id: applicationId, workspaceId },
    include: { appAttachments: true, appNotes: true, tasks: true, opportunity: true },
  });
  if (!app) return;

  await db.readinessGap.deleteMany({ where: { applicationId, isResolved: false } });

  const gaps = computeReadinessGaps(app, app.opportunity);
  if (gaps.length > 0) {
    await db.readinessGap.createMany({
      data: gaps.map((g) => ({ ...g, applicationId })),
    });
  }

  revalidatePath(`/applications/${applicationId}`);
  return { success: true, gaps };
}

export async function resolveGap(gapId: string) {
  const { workspaceId, userId } = await getWorkspaceContext();

  // Verify gap belongs to this workspace
  const gap = await db.readinessGap.findFirst({
    where: { id: gapId, application: { workspaceId } },
  });
  if (!gap) throw new Error("Not found");

  await db.readinessGap.update({
    where: { id: gapId },
    data: { isResolved: true, resolvedAt: new Date(), resolvedById: userId },
  });

  revalidatePath("/applications");
  return { success: true };
}
