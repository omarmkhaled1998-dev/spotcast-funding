/**
 * ScoringProfile — the canonical shape used by both scoring engines.
 *
 * Populated from OrgProfile (for org workspaces) or UserProfile (for individual
 * workspaces). The profile is loaded once per request in the page/action that
 * calls the scorer — never hardcoded in the scoring module itself.
 */

import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";

export interface OrgScoringProfile {
  type: "ORG";
  thematicAreas: string[];   // e.g. ["media development", "civil society"]
  geography: string[];       // e.g. ["lebanon", "mena"]
  fundingRangeMin: number;   // USD
  fundingRangeMax: number;   // USD
  existingFunders: string[]; // donor names already in relationship with
  name: string;              // workspace / org name (for display)
}

export interface UserScoringProfile {
  type: "USER";
  keywords: string[];
  strategicPriorities: string[];
  existingFunders: string[];
  geography: string[];       // preferred regions
  thematicInterests: string[];
  name: string;              // user display name
}

export type ScoringProfile = OrgScoringProfile | UserScoringProfile;

// ── Load profile from DB ──────────────────────────────────────────────────────

/**
 * Load the scoring profile for a workspace. Returns an org profile if the
 * workspace has one, otherwise a user profile, otherwise null.
 */
export async function loadScoringProfile(
  workspaceId: string,
  userId?: string
): Promise<ScoringProfile | null> {
  // Try org profile first
  const orgProfile = await db.orgProfile.findUnique({
    where: { workspaceId },
  });

  if (orgProfile) {
    return {
      type: "ORG",
      name: orgProfile.orgName,
      thematicAreas: parseJsonArray(orgProfile.thematicAreas),
      geography: parseJsonArray(orgProfile.geography),
      fundingRangeMin: orgProfile.fundingRangeMin ?? 10000,
      fundingRangeMax: orgProfile.fundingRangeMax ?? 500000,
      existingFunders: parseJsonArray(orgProfile.existingFunders),
    };
  }

  // Fall back to user profile
  const whereClause = userId
    ? { userId }
    : { workspaceId: workspaceId };

  const userProfile = await db.userProfile.findFirst({ where: whereClause });

  if (userProfile) {
    return {
      type: "USER",
      name: userProfile.name,
      keywords: parseJsonArray(userProfile.keywords),
      strategicPriorities: parseJsonArray(userProfile.strategicPriorities),
      existingFunders: parseJsonArray(userProfile.existingFunders),
      geography: parseJsonArray(userProfile.geography),
      thematicInterests: parseJsonArray(userProfile.thematicInterests),
    };
  }

  return null;
}

// ── Empty / default profiles (used as fallback when no profile exists) ────────

export const DEFAULT_ORG_PROFILE: OrgScoringProfile = {
  type: "ORG",
  name: "My Organization",
  thematicAreas: [],
  geography: [],
  fundingRangeMin: 10000,
  fundingRangeMax: 500000,
  existingFunders: [],
};

export const DEFAULT_USER_PROFILE: UserScoringProfile = {
  type: "USER",
  name: "Me",
  keywords: [],
  strategicPriorities: [],
  existingFunders: [],
  geography: [],
  thematicInterests: [],
};
