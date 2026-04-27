/**
 * AI-powered opportunity analysis.
 *
 * Generates a narrative "why this fits / why it doesn't" analysis for a
 * specific workspace+opportunity pair and persists it as an OpportunityAnalysis.
 *
 * Uses "fast" (Haiku) tier — called in bulk during ingest.
 * Cache: never re-analyze if an OpportunityAnalysis row already exists for
 *        this workspace+opportunity (7-day TTL).
 */
import { db } from "@/lib/db";
import { ai } from "./index";
import { buildWorkspaceContext, buildOpportunityContext } from "./context";
import { checkAiUsage, recordAiUsage } from "./rate-limit";
import { parseJsonArray } from "@/lib/utils";

const CACHE_TTL_DAYS = 7;

export interface AnalysisResult {
  id: string;
  aiScore: number | null;
  fitLabel: "SUITABLE" | "MAYBE" | "NOT_SUITABLE" | null;
  summary: string;
  whyMatch: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
  cached: boolean;
}

/**
 * Analyse an opportunity for a workspace. Returns cached result if fresh.
 */
export async function analyzeOpportunity(
  opportunityId: string,
  workspaceId: string,
  options: { force?: boolean } = {}
): Promise<AnalysisResult | { error: string }> {

  // ── 1. Check cache ──────────────────────────────────────────────────────────
  if (!options.force) {
    const ttlCutoff = new Date();
    ttlCutoff.setDate(ttlCutoff.getDate() - CACHE_TTL_DAYS);

    const existing = await db.opportunityAnalysis.findFirst({
      where: {
        opportunityId,
        workspaceId,
        createdAt: { gte: ttlCutoff },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return {
        id: existing.id,
        aiScore: existing.aiScore,
        fitLabel: existing.fitLabel as "SUITABLE" | "MAYBE" | "NOT_SUITABLE" | null,
        summary: existing.summary ?? "",
        whyMatch: existing.whyMatch ?? "",
        strengths: parseJsonArray(existing.strengths),
        risks: parseJsonArray(existing.risks),
        recommendation: existing.recommendation ?? "",
        cached: true,
      };
    }
  }

  // ── 2. Rate-limit check ─────────────────────────────────────────────────────
  const usage = await checkAiUsage(workspaceId);
  if (!usage.allowed) {
    return {
      error: `Daily AI limit reached (${usage.used}/${usage.limit} requests). Resets at midnight UTC.`,
    };
  }

  // ── 3. Load data ─────────────────────────────────────────────────────────────
  const opp = await db.opportunity.findUnique({
    where: { id: opportunityId },
    include: { donor: { select: { name: true, countryOfOrigin: true } } },
  });

  if (!opp) return { error: "Opportunity not found" };

  const [orgCtx] = await Promise.all([
    buildWorkspaceContext(workspaceId),
  ]);

  const oppCtx = buildOpportunityContext(opp);

  // ── 4. Build prompt ──────────────────────────────────────────────────────────
  const system = [
    "You are a funding strategy analyst. Your job is to assess whether a funding opportunity is a good fit for an organization.",
    "Be concise, specific, and actionable. Avoid generic statements.",
    "Return ONLY valid JSON matching the schema below — no markdown, no explanation outside the JSON.",
    "",
    orgCtx.text,
  ].join("\n");

  const userMessage = [
    oppCtx,
    opp.donor ? `**Donor:** ${opp.donor.name}${opp.donor.countryOfOrigin ? ` (${opp.donor.countryOfOrigin})` : ""}` : "",
    "",
    "Analyze the fit between this organization and opportunity. Return JSON:",
    "```json",
    "{",
    '  "aiScore": <integer 0-100>,',
    '  "fitLabel": <"SUITABLE"|"MAYBE"|"NOT_SUITABLE">,',
    '  "summary": "<2-3 sentence plain-language summary of the opportunity>",',
    '  "whyMatch": "<2-3 sentences on why this is or isn\'t a fit for this organization>",',
    '  "strengths": ["<strength 1>", "<strength 2>"],',
    '  "risks": ["<risk 1>", "<risk 2>"],',
    '  "recommendation": "<1 sentence clear action recommendation>"',
    "}",
    "```",
  ]
    .filter(Boolean)
    .join("\n");

  // ── 5. Call AI ───────────────────────────────────────────────────────────────
  const provider = ai();
  const response = await provider.complete({
    tier: "fast",
    system,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 600,
    temperature: 0.2,
  });

  // ── 6. Parse response ────────────────────────────────────────────────────────
  let parsed: {
    aiScore?: number;
    fitLabel?: string;
    summary?: string;
    whyMatch?: string;
    strengths?: string[];
    risks?: string[];
    recommendation?: string;
  } = {};

  try {
    // Strip markdown code fences if model adds them
    const clean = response.content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    // If JSON parse fails, create a minimal analysis from raw text
    parsed = {
      summary: response.content.substring(0, 300),
      whyMatch: "Analysis available — see summary.",
    };
  }

  const fitLabel = ["SUITABLE", "MAYBE", "NOT_SUITABLE"].includes(parsed.fitLabel ?? "")
    ? (parsed.fitLabel as "SUITABLE" | "MAYBE" | "NOT_SUITABLE")
    : null;

  // ── 7. Persist analysis ──────────────────────────────────────────────────────
  const analysis = await db.opportunityAnalysis.create({
    data: {
      opportunityId,
      workspaceId,
      profileType: "ORG",
      aiScore: typeof parsed.aiScore === "number" ? parsed.aiScore : null,
      fitLabel,
      summary: parsed.summary ?? "",
      whyMatch: parsed.whyMatch ?? "",
      strengths: JSON.stringify(parsed.strengths ?? []),
      risks: JSON.stringify(parsed.risks ?? []),
      recommendation: parsed.recommendation ?? "",
      model: response.model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    },
  });

  // ── 8. Record usage ──────────────────────────────────────────────────────────
  await recordAiUsage({
    workspaceId,
    opportunityId,
    type: "OPPORTUNITY_ANALYSIS",
    prompt: userMessage.substring(0, 1000),
    content: response.content.substring(0, 2000),
    model: response.model,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    costUsdCents: response.costUsdCents,
  });

  return {
    id: analysis.id,
    aiScore: analysis.aiScore,
    fitLabel,
    summary: analysis.summary ?? "",
    whyMatch: analysis.whyMatch ?? "",
    strengths: parseJsonArray(analysis.strengths),
    risks: parseJsonArray(analysis.risks),
    recommendation: analysis.recommendation ?? "",
    cached: false,
  };
}
