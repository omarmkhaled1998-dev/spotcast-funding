/**
 * Personal Opportunity Radar
 *
 * Scores all workspace opportunities against the current user's UserProfile
 * from the DB. If no profile exists, shows a prompt to set one up.
 */

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { scoreForUser, type ScoringInput } from "@/lib/personal-scoring";
import { parseJsonArray } from "@/lib/utils";
import type { UserScoringProfile } from "@/lib/scoring-profile";
import { RadarClient } from "@/components/radar/radar-client";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let workspaceId: string;
  let userId: string;
  try {
    const ctx = await getWorkspaceContext();
    workspaceId = ctx.workspaceId;
    userId = ctx.userId;
  } catch {
    redirect("/login");
  }

  // Load the user's personal profile from DB
  const dbProfile = await db.userProfile.findUnique({ where: { userId } });

  const profile: UserScoringProfile | null = dbProfile
    ? {
        type: "USER",
        name: dbProfile.name,
        keywords: parseJsonArray(dbProfile.keywords),
        strategicPriorities: parseJsonArray(dbProfile.strategicPriorities),
        existingFunders: parseJsonArray(dbProfile.existingFunders),
        geography: parseJsonArray(dbProfile.geography),
        thematicInterests: parseJsonArray(dbProfile.thematicInterests),
      }
    : null;

  // Pull every non-expired opportunity in this workspace + donor name
  const raw = await db.opportunity.findMany({
    where: {
      workspaceId,
      OR: [{ deadlineDate: { gte: new Date() } }, { deadlineDate: null }],
    },
    include: { donor: { select: { name: true } } },
    orderBy: { foundAt: "desc" },
    take: 500,
  });

  // Score each opportunity against the user profile
  const scored = raw.map((opp) => {
    const input: ScoringInput = {
      title: opp.title,
      description: opp.fullDescription,
      thematicAreas: opp.thematicAreas,
      geography: opp.geography,
      typeOfCall: opp.applicationType,
      donorName: opp.donor?.name ?? null,
      deadlineDate: opp.deadlineDate,
      sourceUrl: opp.sourceUrl,
    };
    const personalScore = scoreForUser(input, profile);
    return {
      id: opp.id,
      title: opp.title,
      sourceUrl: opp.sourceUrl,
      deadlineDate: opp.deadlineDate?.toISOString() ?? null,
      thematicAreas: opp.thematicAreas,
      geography: opp.geography,
      summary: opp.summary,
      typeOfCall: opp.applicationType ?? null,
      fundingAmountMin: opp.fundingAmountMin,
      fundingAmountMax: opp.fundingAmountMax,
      currency: opp.currency,
      urgencyLevel: opp.urgencyLevel,
      donorName: opp.donor?.name ?? null,
      personalScore: personalScore.score,
      fitLabel: personalScore.fitLabel,
      whyMatch: personalScore.whyMatch,
      matchedKeywords: personalScore.matchedKeywords,
      matchedPriorities: personalScore.matchedPriorities,
    };
  });

  scored.sort((a, b) => b.personalScore - a.personalScore);

  const userName = session.user?.name || profile?.name || "You";
  return (
    <RadarClient
      opportunities={scored}
      userName={userName}
      hasProfile={!!profile}
    />
  );
}
