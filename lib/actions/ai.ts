"use server";
import { getWorkspaceContext } from "@/lib/workspace";
import { analyzeOpportunity } from "@/lib/ai/analyze-opportunity";
import { generateWriting, type WritingTaskType } from "@/lib/ai/write";
import { getAiUsageSummary, checkAiUsage } from "@/lib/ai/rate-limit";
import { revalidatePath } from "next/cache";

/**
 * Trigger AI analysis for an opportunity (called from the UI "Analyze" button).
 */
export async function requestOpportunityAnalysis(
  opportunityId: string,
  force = false
) {
  try {
    const { workspaceId } = await getWorkspaceContext();
    const result = await analyzeOpportunity(opportunityId, workspaceId, { force });
    revalidatePath(`/opportunities/${opportunityId}`);
    return result;
  } catch (e: any) {
    return { error: e?.message?.includes("apiKey") || e?.message?.includes("authToken")
      ? "AI features are not configured. Add your ANTHROPIC_API_KEY to .env to enable analysis."
      : (e?.message ?? "Analysis failed. Please try again.") };
  }
}

/**
 * Get AI usage stats for the current workspace (for settings/billing page).
 */
export async function getWorkspaceAiUsage(days = 30) {
  const { workspaceId } = await getWorkspaceContext();
  return getAiUsageSummary(workspaceId, days);
}

/**
 * Check remaining AI quota for the current workspace.
 */
export async function getAiQuota() {
  const { workspaceId } = await getWorkspaceContext();
  return checkAiUsage(workspaceId);
}

/**
 * Generate a written document (concept note, proposal, cover letter, etc.)
 */
export async function generateDocument(
  taskType: WritingTaskType,
  opportunityId?: string,
  applicationId?: string,
  userInstructions?: string,
  language?: string
) {
  try {
    const { workspaceId, userId } = await getWorkspaceContext();
    return await generateWriting({
      workspaceId,
      userId,
      opportunityId,
      applicationId,
      taskType,
      userInstructions,
      language,
    });
  } catch (e: any) {
    return { error: e?.message?.includes("apiKey") || e?.message?.includes("authToken")
      ? "AI features are not configured. Add your ANTHROPIC_API_KEY to .env to enable this."
      : (e?.message ?? "Generation failed. Please try again.") };
  }
}

/**
 * Retrieve saved AI outputs for an opportunity.
 */
export async function getOpportunityAiOutputs(opportunityId: string) {
  const { workspaceId } = await getWorkspaceContext();

  const outputs = await (await import("@/lib/db")).db.aiOutput.findMany({
    where: { workspaceId, opportunityId },
    select: {
      id: true,
      type: true,
      content: true,
      model: true,
      inputTokens: true,
      outputTokens: true,
      costUsdCents: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return outputs;
}
