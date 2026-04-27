"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import { scoreOpportunity } from "@/lib/scoring";
import { loadScoringProfile, DEFAULT_ORG_PROFILE } from "@/lib/scoring-profile";
import { toJsonArray } from "@/lib/utils";
import type { OppStatus } from "@/app/generated/prisma/client";

export async function createOpportunity(data: FormData) {
  const { workspaceId, userId } = await getWorkspaceContext();

  const thematicAreas = data.getAll("thematicAreas") as string[];
  const geography = data.getAll("geography") as string[];

  const opp = await db.opportunity.create({
    data: {
      workspaceId,
      title: data.get("title") as string,
      donorId: (data.get("donorId") as string) || null,
      sourceUrl: (data.get("sourceUrl") as string) || null,
      sourceType: (data.get("sourceType") as "MANUAL") || "MANUAL",
      deadlineDate: data.get("deadlineDate") ? new Date(data.get("deadlineDate") as string) : null,
      deadlineNotes: (data.get("deadlineNotes") as string) || null,
      geography: toJsonArray(geography),
      fundingAmountMin: data.get("fundingAmountMin") ? Number(data.get("fundingAmountMin")) : null,
      fundingAmountMax: data.get("fundingAmountMax") ? Number(data.get("fundingAmountMax")) : null,
      currency: (data.get("currency") as string) || "USD",
      thematicAreas: toJsonArray(thematicAreas),
      eligibilitySummary: (data.get("eligibilitySummary") as string) || null,
      eligibilityFullText: (data.get("eligibilityFullText") as string) || null,
      applicationType: (data.get("applicationType") as "OPEN") || null,
      languageRequirement: (data.get("languageRequirement") as string) || null,
      partnerRequired: data.get("partnerRequired") === "true",
      partnerNotes: (data.get("partnerNotes") as string) || null,
      registrationRequirement: (data.get("registrationRequirement") as string) || null,
      summary: (data.get("summary") as string) || null,
      fullDescription: (data.get("fullDescription") as string) || null,
      urgencyLevel: (data.get("urgencyLevel") as "MEDIUM") || "MEDIUM",
      foundById: userId,
      foundAt: new Date(),
      createdById: userId,
    },
  });

  // Auto-score after creation
  await recalculateScore(opp.id, workspaceId);

  await db.activityLog.create({
    data: {
      workspaceId,
      userId,
      action: "created_opportunity",
      opportunityId: opp.id,
      newValue: JSON.stringify({ title: opp.title }),
    },
  });

  revalidatePath("/opportunities");
  return { success: true, id: opp.id };
}

export async function updateOpportunity(id: string, data: FormData) {
  const { workspaceId } = await getWorkspaceContext();

  // Verify ownership
  await db.opportunity.findFirstOrThrow({ where: { id, workspaceId } });

  const thematicAreas = data.getAll("thematicAreas") as string[];
  const geography = data.getAll("geography") as string[];

  await db.opportunity.update({
    where: { id },
    data: {
      title: data.get("title") as string,
      donorId: (data.get("donorId") as string) || null,
      sourceUrl: (data.get("sourceUrl") as string) || null,
      deadlineDate: data.get("deadlineDate") ? new Date(data.get("deadlineDate") as string) : null,
      deadlineNotes: (data.get("deadlineNotes") as string) || null,
      geography: toJsonArray(geography),
      fundingAmountMin: data.get("fundingAmountMin") ? Number(data.get("fundingAmountMin")) : null,
      fundingAmountMax: data.get("fundingAmountMax") ? Number(data.get("fundingAmountMax")) : null,
      currency: (data.get("currency") as string) || "USD",
      thematicAreas: toJsonArray(thematicAreas),
      eligibilitySummary: (data.get("eligibilitySummary") as string) || null,
      eligibilityFullText: (data.get("eligibilityFullText") as string) || null,
      applicationType: (data.get("applicationType") as "OPEN") || null,
      languageRequirement: (data.get("languageRequirement") as string) || null,
      partnerRequired: data.get("partnerRequired") === "true",
      partnerNotes: (data.get("partnerNotes") as string) || null,
      registrationRequirement: (data.get("registrationRequirement") as string) || null,
      summary: (data.get("summary") as string) || null,
      fullDescription: (data.get("fullDescription") as string) || null,
      urgencyLevel: (data.get("urgencyLevel") as "MEDIUM") || "MEDIUM",
    },
  });

  await recalculateScore(id, workspaceId);
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
  return { success: true };
}

export async function updateOpportunityStatus(id: string, status: OppStatus) {
  const { workspaceId, userId } = await getWorkspaceContext();

  const opp = await db.opportunity.findFirstOrThrow({ where: { id, workspaceId } });
  await db.opportunity.update({ where: { id }, data: { status } });

  await db.activityLog.create({
    data: {
      workspaceId,
      userId,
      action: "status_changed",
      opportunityId: id,
      oldValue: JSON.stringify({ status: opp.status }),
      newValue: JSON.stringify({ status }),
    },
  });

  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/opportunities");
  return { success: true };
}

export async function recordDecision(
  opportunityId: string,
  decision: "PURSUE" | "HOLD" | "DECLINE",
  reason: string
) {
  const { workspaceId, userId } = await getWorkspaceContext();

  const opp = await db.opportunity.findFirstOrThrow({ where: { id: opportunityId, workspaceId } });

  await db.decision.upsert({
    where: { opportunityId },
    update: { decision, reason, decidedById: userId, decidedAt: new Date() },
    create: { opportunityId, workspaceId, decision, reason, decidedById: userId },
  });

  const statusMap: Record<string, OppStatus> = {
    PURSUE: "GO",
    HOLD: "HOLD",
    DECLINE: "NO_GO",
  };
  await db.opportunity.update({
    where: { id: opportunityId },
    data: { status: statusMap[decision] },
  });

  if (decision === "PURSUE") {
    const existing = await db.application.findUnique({ where: { opportunityId } });
    if (!existing) {
      await db.application.create({
        data: {
          workspaceId,
          opportunityId,
          donorId: opp.donorId,
          ownerId: userId,
          createdById: userId,
          donorDeadline: opp.deadlineDate,
        },
      });
    }
  }

  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/opportunities");
  revalidatePath("/applications");
  return { success: true };
}

export async function recalculateScore(opportunityId: string, workspaceId?: string) {
  const opp = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: { donor: true },
  });
  if (!opp) return;

  const rawProfile = await loadScoringProfile(workspaceId ?? opp.workspaceId);
  const scoringProfile =
    rawProfile?.type === "ORG"
      ? rawProfile
      : rawProfile?.type === "USER"
        ? { ...DEFAULT_ORG_PROFILE, thematicAreas: rawProfile.thematicInterests, geography: rawProfile.geography }
        : DEFAULT_ORG_PROFILE;

  const donorRel: string | undefined = opp.donor?.relationshipStrength ?? undefined;
  const result = scoreOpportunity(opp, scoringProfile, donorRel);

  await db.opportunity.update({
    where: { id: opportunityId },
    data: {
      suitabilityScore: result.score,
      fitLabel: result.fitLabel,
      scoreBreakdown: JSON.stringify(result.breakdown),
    },
  });

  await db.scoringResult.create({
    data: {
      workspaceId: workspaceId ?? opp.workspaceId,
      opportunityId,
      totalScore: result.score,
      fitLabel: result.fitLabel,
      breakdown: JSON.stringify(result.breakdown),
      explanation: result.explanation,
      scoredBy: "AUTO",
    },
  });
}

export async function deleteOpportunity(id: string) {
  const { workspaceId } = await getWorkspaceContext();
  await db.opportunity.findFirstOrThrow({ where: { id, workspaceId } });
  await db.opportunity.delete({ where: { id } });
  revalidatePath("/opportunities");
  return { success: true };
}
