/**
 * AI writing assistant — generates funding-related documents.
 *
 * Uses "smart" (Sonnet) tier — called interactively from the UI.
 * Every output is persisted as an AiOutput row for caching + cost tracking.
 */
import { db } from "@/lib/db";
import { ai } from "./index";
import { buildWorkspaceContext, buildOpportunityContext } from "./context";
import { checkAiUsage, recordAiUsage } from "./rate-limit";

export type WritingTaskType =
  | "CONCEPT_NOTE_DRAFT"
  | "PROPOSAL_DRAFT"
  | "COVER_LETTER"
  | "BIO"
  | "BUDGET_NARRATIVE"
  | "ELIGIBILITY_CHECK";

export interface WritingRequest {
  workspaceId: string;
  userId?: string;
  opportunityId?: string;
  applicationId?: string;
  taskType: WritingTaskType;
  /** Extra instructions from the user */
  userInstructions?: string;
  /** Language to write in (default: English) */
  language?: string;
}

export interface WritingResult {
  id: string;
  content: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsdCents: number;
  cached: boolean;
}

// ── Task configs ─────────────────────────────────────────────────────────────

const TASK_CONFIGS: Record<
  WritingTaskType,
  { label: string; maxTokens: number; systemInstructions: string }
> = {
  CONCEPT_NOTE_DRAFT: {
    label: "concept note",
    maxTokens: 2000,
    systemInstructions: `Write a 2-3 page concept note (approximately 700-900 words) following this structure:
1. Project Title
2. Project Summary (2-3 sentences)
3. Problem Statement (describe the problem this project addresses)
4. Proposed Solution (what will be done and how)
5. Target Beneficiaries
6. Key Activities (bullet points)
7. Expected Outcomes
8. Budget Estimate (rough range only)
9. Organization Capacity (why your org is positioned to do this)
Use clear, professional language. Avoid jargon. Be specific and evidence-based.`,
  },
  PROPOSAL_DRAFT: {
    label: "proposal draft",
    maxTokens: 3000,
    systemInstructions: `Write a full grant proposal following this structure:
1. Executive Summary
2. Background and Context
3. Problem Statement with supporting data
4. Project Description: Objectives, Activities, Timeline
5. Methodology and Approach
6. Monitoring, Evaluation and Learning (MEL) plan
7. Organizational Capacity
8. Budget Narrative overview
9. Sustainability Plan
Be persuasive, specific, and professionally formatted.`,
  },
  COVER_LETTER: {
    label: "cover letter",
    maxTokens: 600,
    systemInstructions: `Write a professional, 3-paragraph cover letter for a grant application:
Para 1: Who the organization is and why they're applying to this specific funder.
Para 2: What the project is and why it's urgent/important.
Para 3: Why the organization is uniquely positioned to deliver this, and a call to action.
Tone: confident but not arrogant. No generic boilerplate. Maximum 300 words.`,
  },
  BIO: {
    label: "organizational bio",
    maxTokens: 400,
    systemInstructions: `Write a concise organizational bio suitable for grant applications (max 150 words).
Include: founding year (if known), mission, key thematic areas, geography, past achievements, and why the org is credible. Professional and factual tone.`,
  },
  BUDGET_NARRATIVE: {
    label: "budget narrative",
    maxTokens: 1200,
    systemInstructions: `Write a budget narrative that justifies the key line items in a funding proposal.
Structure: for each major cost category (Personnel, Operations, Activities, Indirect), explain what it is, why it's needed, and how the amount was calculated.
Be specific and defensible. Show value for money.`,
  },
  ELIGIBILITY_CHECK: {
    label: "eligibility assessment",
    maxTokens: 600,
    systemInstructions: `Assess whether the organization is likely eligible to apply for this opportunity.
Cover: geographic eligibility, thematic alignment, registration requirements, language, partnership requirements, and funding range match.
Be honest — flag any red flags clearly. End with a clear ELIGIBLE / POSSIBLY ELIGIBLE / LIKELY INELIGIBLE verdict.`,
  },
};

/**
 * Generate a written document using AI.
 * Returns cached AiOutput if one exists (same workspace + opportunity + type, created today).
 */
export async function generateWriting(
  request: WritingRequest
): Promise<WritingResult | { error: string }> {
  const { workspaceId, opportunityId, applicationId, taskType, userInstructions, language = "English" } = request;

  // ── 1. Check rate limit ───────────────────────────────────────────────────
  const usage = await checkAiUsage(workspaceId);
  if (!usage.allowed) {
    return {
      error: `Daily AI limit reached (${usage.used}/${usage.limit} requests). Resets at midnight UTC.`,
    };
  }

  // ── 2. Check cache (same type + opportunity + workspace, created today) ──
  if (opportunityId) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const cached = await db.aiOutput.findFirst({
      where: {
        workspaceId,
        opportunityId,
        type: taskType,
        createdAt: { gte: today },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached && !userInstructions) {
      return {
        id: cached.id,
        content: cached.content,
        model: cached.model,
        inputTokens: cached.inputTokens,
        outputTokens: cached.outputTokens,
        costUsdCents: cached.costUsdCents,
        cached: true,
      };
    }
  }

  // ── 3. Build context ─────────────────────────────────────────────────────
  const [orgCtx] = await Promise.all([buildWorkspaceContext(workspaceId)]);

  let oppCtx = "";
  if (opportunityId) {
    const opp = await db.opportunity.findUnique({
      where: { id: opportunityId },
      include: { donor: { select: { name: true, countryOfOrigin: true } } },
    });
    if (opp) {
      oppCtx = buildOpportunityContext(opp);
      if (opp.donor) {
        oppCtx += `\n**Donor:** ${opp.donor.name}${opp.donor.countryOfOrigin ? ` (${opp.donor.countryOfOrigin})` : ""}`;
      }
    }
  }

  const taskConfig = TASK_CONFIGS[taskType];

  // ── 4. Build prompt ──────────────────────────────────────────────────────
  const system = [
    `You are an expert grant writer specializing in NGO and media sector funding in the MENA region.`,
    `Write in ${language}. Be specific to the organization and opportunity provided.`,
    ``,
    taskConfig.systemInstructions,
    ``,
    orgCtx.text,
  ].join("\n");

  const userParts: string[] = [];
  if (oppCtx) userParts.push(oppCtx);
  userParts.push(`\nPlease write a ${taskConfig.label} for the above opportunity.`);
  if (userInstructions) {
    userParts.push(`\nAdditional instructions: ${userInstructions}`);
  }

  const userMessage = userParts.join("\n");

  // ── 5. Call AI ───────────────────────────────────────────────────────────
  const provider = ai();
  const response = await provider.complete({
    tier: "smart",
    system,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: taskConfig.maxTokens,
    temperature: 0.4,
  });

  // ── 6. Persist output ────────────────────────────────────────────────────
  const outputId = await recordAiUsage({
    workspaceId,
    opportunityId,
    applicationId,
    type: taskType,
    prompt: userMessage.substring(0, 1000),
    content: response.content,
    model: response.model,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    costUsdCents: response.costUsdCents,
  });

  return {
    id: outputId,
    content: response.content,
    model: response.model,
    inputTokens: response.inputTokens,
    outputTokens: response.outputTokens,
    costUsdCents: response.costUsdCents,
    cached: false,
  };
}
