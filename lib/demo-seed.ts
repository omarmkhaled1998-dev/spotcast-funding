/**
 * Seeds 5 demo opportunities for a new workspace so new users aren't greeted
 * by a blank screen. Demo opps are identified by externalId prefix "demo:".
 *
 * Called after workspace creation (or from prisma/seed.ts for the SpotCast workspace).
 * Safe to call multiple times — skips if demo opps already exist.
 */

import { db } from "@/lib/db";

const DEMO_OPPS = [
  {
    externalId: "demo:eu-democracy-fund-2025",
    title: "EU Democracy Fund – Civil Society Organizations 2025",
    donorName: "European Union",
    thematicAreas: ["democracy", "civil society", "human rights"],
    geography: ["MENA", "Arab World"],
    fundingAmountMin: 50_000,
    fundingAmountMax: 150_000,
    deadlineDays: 32,
    suitabilityScore: 78,
    fitLabel: "SUITABLE" as const,
    summary:
      "The EU Democracy Fund supports civil society organizations in the MENA region working to strengthen democratic institutions, promote civic participation, and protect human rights. Grants range from $50k to $150k for 12–24 month projects.",
    aiAnalysis: {
      aiScore: 78,
      fitLabel: "SUITABLE" as const,
      summary:
        "The EU Democracy Fund is a strong match for organizations working at the intersection of media and civil society. It prioritizes projects with measurable democratic impact and strong community engagement.",
      whyMatch:
        "This fund targets exactly the intersection of media development and civic engagement. Your geographic presence in MENA and demonstrated work in community mobilization aligns with the funder's stated priorities.",
      strengths: [
        "Direct thematic overlap with civil society and media freedom",
        "Geographic eligibility — MENA applicants are explicitly invited",
        "Grant size ($50k–$150k) matches typical project budgets for mid-size NGOs",
      ],
      risks: [
        "Competitive — typically 200+ applications per cycle",
        "Requires a co-applicant or partner organization from an EU member state",
      ],
      recommendation:
        "Pursue this grant. Prioritize identifying a credible EU-based partner early and frame your application around measurable civic impact indicators.",
    },
  },
  {
    externalId: "demo:osf-media-freedom-2025",
    title: "Open Society Foundations: Media Freedom Initiative",
    donorName: "Open Society Foundations",
    thematicAreas: ["media development", "freedom of expression", "journalism"],
    geography: ["Global", "MENA"],
    fundingAmountMin: 30_000,
    fundingAmountMax: 80_000,
    deadlineDays: 19,
    suitabilityScore: 71,
    fitLabel: "SUITABLE" as const,
    summary:
      "OSF's Media Freedom Initiative supports independent media outlets and journalism organizations facing threats to press freedom. Funding covers operational sustainability, safety training, and investigative journalism projects.",
    aiAnalysis: {
      aiScore: 71,
      fitLabel: "SUITABLE" as const,
      summary:
        "A well-established funder with a long track record supporting independent media in challenging environments. This initiative focuses on sustainability, not just projects.",
      whyMatch:
        "Open Society consistently funds organizations that combine editorial independence with community impact — a strong match for media-focused organizations in the MENA region.",
      strengths: [
        "Funder has a history of multi-year support (not just one-off grants)",
        "No partner requirement — single organizations are eligible",
        "Strong alignment with press freedom and digital media work",
      ],
      risks: [
        "Deadline is in 19 days — limited preparation time",
        "OSF typically requires a detailed theory of change and strong M&E framework",
      ],
      recommendation:
        "Worth pursuing if you can dedicate 2 weeks to a strong application. Focus on sustainability metrics and measurable press freedom outcomes.",
    },
  },
  {
    externalId: "demo:ned-small-grants-2025",
    title: "NED Small Grants for Independent Media",
    donorName: "National Endowment for Democracy",
    thematicAreas: ["journalism", "investigative journalism", "media freedom"],
    geography: ["MENA"],
    fundingAmountMin: 15_000,
    fundingAmountMax: 50_000,
    deadlineDays: 45,
    suitabilityScore: 64,
    fitLabel: "MAYBE" as const,
    summary:
      "NED's Small Grants program funds independent journalists and small media organizations in emerging democracies. Eligible activities include investigative reporting, journalist training, and digital security.",
    aiAnalysis: {
      aiScore: 64,
      fitLabel: "MAYBE" as const,
      summary:
        "NED Small Grants is accessible for smaller organizations but has strict requirements around editorial independence and no government affiliation.",
      whyMatch:
        "Thematic fit is good — investigative journalism and media freedom are core areas. However, the grant ceiling ($50k) may be lower than your typical project size.",
      strengths: [
        "Rapid application process — typically 4-6 weeks to decision",
        "Strong focus on investigative and accountability journalism",
        "High success rate for first-time applicants with clear track records",
      ],
      risks: [
        "Maximum grant ($50k) may not cover full project costs",
        "NED requires applicants to have no formal government affiliation or funding",
      ],
      recommendation:
        "Consider for a smaller, self-contained project like a specific investigative series or a journalist training cohort. Not suitable as primary institutional funding.",
    },
  },
  {
    externalId: "demo:usaid-local-works-2025",
    title: "USAID Local Works: Community Resilience Program",
    donorName: "USAID",
    thematicAreas: ["community development", "local development", "civil society"],
    geography: ["Global"],
    fundingAmountMin: 100_000,
    fundingAmountMax: 500_000,
    deadlineDays: 60,
    suitabilityScore: 45,
    fitLabel: "MAYBE" as const,
    summary:
      "USAID Local Works funds locally-led development initiatives that build community resilience. Emphasis on locally-rooted organizations with demonstrated community trust and participatory approaches.",
    aiAnalysis: {
      aiScore: 45,
      fitLabel: "MAYBE" as const,
      summary:
        "A large program with strong potential but significant thematic stretch from core media/journalism work. The community focus is broad enough to include media literacy components.",
      whyMatch:
        "Your community engagement work could qualify under the resilience framing, but this is a stretch from your core identity as a media organization. The funding is substantial but competitive.",
      strengths: [
        "Large grant size ($100k–$500k) for multi-year programming",
        "USAID actively seeks locally-rooted organizations as prime recipients",
      ],
      risks: [
        "Significant compliance burden — USAID requires detailed financial reporting",
        "Core media/journalism work may not qualify without strong community development framing",
        "Typically requires 1-2 years of prior USAID subgrant experience",
      ],
      recommendation:
        "Only pursue if you can genuinely frame your work as community resilience, not media development. Otherwise, your time is better spent on closer matches.",
    },
  },
  {
    externalId: "demo:unesco-radio-fund-2025",
    title: "UNESCO Community Radio Support Fund",
    donorName: "UNESCO",
    thematicAreas: ["community media", "media literacy", "local development"],
    geography: ["Global"],
    fundingAmountMin: 10_000,
    fundingAmountMax: 25_000,
    deadlineDays: 75,
    suitabilityScore: 38,
    fitLabel: "NOT_SUITABLE" as const,
    summary:
      "UNESCO's Community Radio Support Fund specifically supports licensed community radio stations in developing countries. Funding covers equipment, training, and content production costs.",
    aiAnalysis: {
      aiScore: 38,
      fitLabel: "NOT_SUITABLE" as const,
      summary:
        "This fund is narrowly focused on licensed community radio operations. Organizations without an active radio license are not eligible.",
      whyMatch:
        "The thematic area (community media) overlaps, but eligibility is restricted to organizations that operate a licensed community radio station — a hard requirement that limits applicability.",
      strengths: [
        "Fast-track review process (6 weeks)",
        "Straightforward reporting requirements",
      ],
      risks: [
        "Hard eligibility requirement: must operate a licensed community radio station",
        "Grant ceiling ($25k) covers equipment only — not staffing or programming",
        "Not eligible if primary work is digital/online media",
      ],
      recommendation:
        "Do not pursue unless you operate a licensed community radio station. Focus your time on the higher-match opportunities above.",
    },
  },
];

export async function seedDemoOpportunities(workspaceId: string): Promise<void> {
  // Check if demos already exist for this workspace
  const existing = await db.opportunity.count({
    where: {
      workspaceId,
      externalId: { startsWith: "demo:" },
    },
  });
  if (existing > 0) return; // already seeded

  // Find or create a system user for attribution
  const systemUser = await db.user.findFirst({
    where: { email: "admin@spotcast.org" },
    select: { id: true },
  });

  const now = new Date();

  for (const demo of DEMO_OPPS) {
    // Find or create a donor
    let donorId: string | null = null;
    if (demo.donorName) {
      const existingDonor = await db.donor.findFirst({
        where: { workspaceId, name: { contains: demo.donorName, mode: "insensitive" } },
        select: { id: true },
      });
      if (existingDonor) {
        donorId = existingDonor.id;
      } else {
        const newDonor = await db.donor.create({
          data: {
            workspaceId,
            name: demo.donorName,
            type: "BILATERAL",
            relationshipStrength: "NONE",
            createdById: systemUser?.id ?? null,
          },
        });
        donorId = newDonor.id;
      }
    }

    const deadline = new Date(now.getTime() + demo.deadlineDays * 86400_000);

    const urgency =
      demo.deadlineDays <= 7 ? "CRITICAL"
      : demo.deadlineDays <= 14 ? "HIGH"
      : demo.deadlineDays <= 30 ? "MEDIUM"
      : "LOW";

    const opp = await db.opportunity.create({
      data: {
        workspaceId,
        externalId: demo.externalId,
        title: demo.title,
        donorId,
        sourceType: "MANUAL",
        deadlineDate: deadline,
        geography: JSON.stringify(demo.geography),
        thematicAreas: JSON.stringify(demo.thematicAreas),
        fundingAmountMin: demo.fundingAmountMin,
        fundingAmountMax: demo.fundingAmountMax,
        currency: "USD",
        summary: demo.summary,
        status: "NEEDS_REVIEW",
        urgencyLevel: urgency as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        suitabilityScore: demo.suitabilityScore,
        fitLabel: demo.fitLabel,
        dataConfidence: "UNVERIFIED",
        foundById: systemUser?.id ?? null,
        foundAt: now,
        createdById: systemUser?.id ?? null,
      },
    });

    // Seed pre-written AI analysis
    await db.opportunityAnalysis.create({
      data: {
        opportunityId: opp.id,
        workspaceId,
        profileType: "ORG",
        aiScore: demo.aiAnalysis.aiScore,
        fitLabel: demo.aiAnalysis.fitLabel,
        summary: demo.aiAnalysis.summary,
        whyMatch: demo.aiAnalysis.whyMatch,
        strengths: JSON.stringify(demo.aiAnalysis.strengths),
        risks: JSON.stringify(demo.aiAnalysis.risks),
        recommendation: demo.aiAnalysis.recommendation,
        model: "demo",
        inputTokens: 0,
        outputTokens: 0,
      },
    });
  }
}
