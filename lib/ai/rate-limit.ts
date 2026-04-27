/**
 * Workspace AI usage tracking and rate limiting.
 *
 * Hard cap per plan:
 *   INDIVIDUAL (or no subscription)  → 20 requests/day
 *   BASE (ORG)                        → 100 requests/day
 *   BASE_PLUS_ALERTS (ORG+Alerts)     → 100 requests/day (same — alerts use separate budget)
 *
 * "Day" = rolling 24h window anchored at UTC midnight.
 */
import { db } from "@/lib/db";

export const DAILY_LIMITS: Record<string, number> = {
  INDIVIDUAL: 20,
  BASE: 100,
  BASE_PLUS_ALERTS: 100,
  DEFAULT: 20, // no subscription / trial
};

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
}

/**
 * Check if workspace can make an AI request.
 * Returns allowed=false if they've hit the daily cap.
 */
export async function checkAiUsage(workspaceId: string): Promise<UsageCheckResult> {
  const subscription = await db.subscription.findUnique({
    where: { workspaceId },
    select: { planType: true, status: true },
  });

  const planType = subscription?.planType ?? "DEFAULT";
  const limit = DAILY_LIMITS[planType] ?? DAILY_LIMITS.DEFAULT;

  // Count AiOutput rows created today for this workspace
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const used = await db.aiOutput.count({
    where: {
      workspaceId,
      createdAt: { gte: startOfDay },
    },
  });

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

/**
 * Record an AI request in AiOutput and return the new record id.
 * Call this AFTER getting the AI response (so we have token counts).
 */
export async function recordAiUsage(params: {
  workspaceId: string;
  opportunityId?: string;
  applicationId?: string;
  type: string;
  prompt: string;
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsdCents: number;
}): Promise<string> {
  const record = await db.aiOutput.create({
    data: {
      workspaceId: params.workspaceId,
      opportunityId: params.opportunityId ?? null,
      applicationId: params.applicationId ?? null,
      type: params.type as "CONCEPT_NOTE_DRAFT",
      prompt: params.prompt,
      content: params.content,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      costUsdCents: params.costUsdCents,
    },
  });
  return record.id;
}

/**
 * Get daily AI cost summary for a workspace (for the cost dashboard).
 */
export async function getAiUsageSummary(workspaceId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.aiOutput.findMany({
    where: { workspaceId, createdAt: { gte: since } },
    select: { createdAt: true, costUsdCents: true, inputTokens: true, outputTokens: true, model: true, type: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCostCents = rows.reduce((s, r) => s + r.costUsdCents, 0);
  const totalInputTokens = rows.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = rows.reduce((s, r) => s + r.outputTokens, 0);

  return {
    totalRequests: rows.length,
    totalCostCents,
    totalCostUsd: (totalCostCents / 100).toFixed(2),
    totalInputTokens,
    totalOutputTokens,
    rows,
  };
}
