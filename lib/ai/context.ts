/**
 * Serializes workspace / user profile data into a compact context block
 * suitable for injecting into AI prompts (~300 tokens).
 *
 * Every AI call should include this as the first section of `system`.
 */
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";

export interface AIContext {
  /** The serialized text to inject into `system` */
  text: string;
  /** Approximate token count (rough estimate: chars / 4) */
  approxTokens: number;
}

/**
 * Load workspace + profile context for a given workspace.
 * Falls back gracefully if no profile is set up.
 */
export async function buildWorkspaceContext(workspaceId: string): Promise<AIContext> {
  const [workspace, orgProfile, memberCount] = await Promise.all([
    db.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, type: true },
    }),
    db.orgProfile.findUnique({
      where: { workspaceId },
      select: {
        orgName: true,
        orgType: true,
        mission: true,
        vision: true,
        previousWork: true,
        contextDocuments: true,
        docExtracts: true,
        thematicAreas: true,
        geography: true,
        fundingRangeMin: true,
        fundingRangeMax: true,
        existingFunders: true,
        website: true,
        registrationCountry: true,
      },
    }),
    db.workspaceMember
      .count({ where: { workspaceId, acceptedAt: { not: null } } })
      .catch(() => 1),
  ]);

  const lines: string[] = [];
  lines.push("## Organization Context");

  const orgName = orgProfile?.orgName ?? workspace?.name ?? "This organization";
  lines.push(`**Name:** ${orgName}`);

  if (orgProfile?.orgType) lines.push(`**Type:** ${orgProfile.orgType}`);
  if (orgProfile?.registrationCountry) lines.push(`**Country:** ${orgProfile.registrationCountry}`);

  if (orgProfile?.mission) {
    lines.push(`**Mission:** ${orgProfile.mission.substring(0, 300)}`);
  }

  if (orgProfile?.vision) {
    lines.push(`**Vision:** ${orgProfile.vision.substring(0, 200)}`);
  }

  const themes = parseJsonArray(orgProfile?.thematicAreas ?? "[]");
  if (themes.length > 0) {
    lines.push(`**Thematic areas:** ${themes.join(", ")}`);
  }

  const geo = parseJsonArray(orgProfile?.geography ?? "[]");
  if (geo.length > 0) {
    lines.push(`**Geographic focus:** ${geo.join(", ")}`);
  }

  if (orgProfile?.fundingRangeMin || orgProfile?.fundingRangeMax) {
    const min = orgProfile.fundingRangeMin
      ? `$${orgProfile.fundingRangeMin.toLocaleString()}`
      : "any";
    const max = orgProfile.fundingRangeMax
      ? `$${orgProfile.fundingRangeMax.toLocaleString()}`
      : "any";
    lines.push(`**Typical grant range:** ${min} – ${max}`);
  }

  const funders = parseJsonArray(orgProfile?.existingFunders ?? "[]");
  if (funders.length > 0) {
    lines.push(`**Existing funders:** ${funders.slice(0, 5).join(", ")}`);
  }

  if (orgProfile?.previousWork) {
    lines.push(`\n**Previous work & portfolio:**\n${orgProfile.previousWork.substring(0, 800)}`);
  }

  if (orgProfile?.contextDocuments) {
    lines.push(`\n**Reference documents (pasted):**\n${orgProfile.contextDocuments.substring(0, 1200)}`);
  }

  // Uploaded document extracts — include up to 3 docs, 600 chars each
  if (orgProfile?.docExtracts) {
    try {
      const docs: Array<{ id: string; name: string; type: string; text: string }> =
        JSON.parse(orgProfile.docExtracts);
      if (docs.length > 0) {
        lines.push(`\n**Uploaded reference documents (${docs.length}):**`);
        docs.slice(0, 3).forEach((doc) => {
          if (doc.text && !doc.text.startsWith("[Could not")) {
            lines.push(`— ${doc.name} (${doc.type}):\n${doc.text.substring(0, 600)}`);
          }
        });
      }
    } catch {
      // malformed JSON — skip silently
    }
  }

  if (!orgProfile) {
    lines.push(
      "_No profile configured. Responses will be generic. Encourage user to set up their profile._"
    );
  }

  const text = lines.join("\n");
  return { text, approxTokens: Math.ceil(text.length / 4) };
}

/**
 * Build a compact context block for an individual user (INDIVIDUAL workspace type).
 */
export async function buildUserContext(userId: string, workspaceId: string): Promise<AIContext> {
  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: {
      name: true,
      location: true,
      region: true,
      thematicInterests: true,
      geography: true,
      keywords: true,
      bio: true,
      existingFunders: true,
    },
  });

  const lines: string[] = [];
  lines.push("## User Context");

  if (profile?.name) lines.push(`**Name:** ${profile.name}`);
  if (profile?.location) lines.push(`**Location:** ${profile.location}`);
  if (profile?.region) lines.push(`**Region:** ${profile.region}`);

  if (profile?.bio) {
    lines.push(`**Background:** ${profile.bio.substring(0, 300)}`);
  }

  const themes = parseJsonArray(profile?.thematicInterests ?? "[]");
  if (themes.length > 0) lines.push(`**Thematic interests:** ${themes.join(", ")}`);

  const geo = parseJsonArray(profile?.geography ?? "[]");
  if (geo.length > 0) lines.push(`**Geographic focus:** ${geo.join(", ")}`);

  const kws = parseJsonArray(profile?.keywords ?? "[]");
  if (kws.length > 0) lines.push(`**Keywords:** ${kws.slice(0, 10).join(", ")}`);

  const funders = parseJsonArray(profile?.existingFunders ?? "[]");
  if (funders.length > 0) lines.push(`**Existing funders:** ${funders.slice(0, 5).join(", ")}`);

  if (!profile) {
    lines.push("_No profile configured. Responses will be generic._");
  }

  const text = lines.join("\n");
  return { text, approxTokens: Math.ceil(text.length / 4) };
}

/**
 * Serialize an opportunity for prompt injection (~500 tokens).
 */
export function buildOpportunityContext(opp: {
  title: string;
  summary?: string | null;
  fullDescription?: string | null;
  thematicAreas?: string | null;
  geography?: string | null;
  fundingAmountMin?: number | null;
  fundingAmountMax?: number | null;
  deadlineDate?: Date | null;
  applicationType?: string | null;
  eligibilitySummary?: string | null;
  languageRequirement?: string | null;
  partnerRequired?: boolean | null;
}): string {
  const lines: string[] = [];
  lines.push("## Funding Opportunity");
  lines.push(`**Title:** ${opp.title}`);

  if (opp.summary) lines.push(`**Summary:** ${opp.summary.substring(0, 400)}`);

  const themes = parseJsonArray(opp.thematicAreas ?? "[]");
  if (themes.length > 0) lines.push(`**Thematic areas:** ${themes.join(", ")}`);

  const geo = parseJsonArray(opp.geography ?? "[]");
  if (geo.length > 0) lines.push(`**Geography:** ${geo.join(", ")}`);

  if (opp.fundingAmountMin || opp.fundingAmountMax) {
    const min = opp.fundingAmountMin ? `$${opp.fundingAmountMin.toLocaleString()}` : "?";
    const max = opp.fundingAmountMax ? `$${opp.fundingAmountMax.toLocaleString()}` : "?";
    lines.push(`**Funding:** ${min} – ${max}`);
  }

  if (opp.deadlineDate) {
    lines.push(`**Deadline:** ${opp.deadlineDate.toISOString().split("T")[0]}`);
  }

  if (opp.applicationType) lines.push(`**Application type:** ${opp.applicationType}`);
  if (opp.eligibilitySummary) lines.push(`**Eligibility:** ${opp.eligibilitySummary.substring(0, 300)}`);
  if (opp.languageRequirement) lines.push(`**Language:** ${opp.languageRequirement}`);
  if (opp.partnerRequired) lines.push(`**Partner required:** Yes`);

  if (opp.fullDescription) {
    lines.push(`**Description:** ${opp.fullDescription.substring(0, 600)}`);
  }

  return lines.join("\n");
}
