"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";

export interface ProfileResult {
  error?: string;
}

// ── Save / update OrgProfile ────────────────────────────────────────────────
export async function saveOrgProfile(formData: FormData): Promise<ProfileResult> {
  const { workspaceId } = await getWorkspaceContext();

  const orgType = (formData.get("orgType") as string)?.trim() || null;
  const mission = (formData.get("mission") as string)?.trim() || null;
  const vision = (formData.get("vision") as string)?.trim() || null;
  const previousWork = (formData.get("previousWork") as string)?.trim() || null;
  const contextDocuments = (formData.get("contextDocuments") as string)?.trim() || null;
  const registrationCountry = (formData.get("registrationCountry") as string)?.trim() || null;
  const website = (formData.get("website") as string)?.trim() || null;
  const thematicAreas = formData.getAll("thematicAreas") as string[];
  const geography = formData.getAll("geography") as string[];
  const fundingRangeMin = parseInt(formData.get("fundingRangeMin") as string) || null;
  const fundingRangeMax = parseInt(formData.get("fundingRangeMax") as string) || null;
  const staffCount = parseInt(formData.get("staffCount") as string) || null;

  try {
    await db.orgProfile.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        orgName: (await db.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { name: true } })).name,
        orgType,
        mission,
        vision,
        previousWork,
        contextDocuments,
        registrationCountry,
        website,
        thematicAreas: JSON.stringify(thematicAreas),
        geography: JSON.stringify(geography),
        fundingRangeMin,
        fundingRangeMax,
        staffCount,
      },
      update: {
        orgType,
        mission,
        vision,
        previousWork,
        contextDocuments,
        registrationCountry,
        website,
        thematicAreas: JSON.stringify(thematicAreas),
        geography: JSON.stringify(geography),
        fundingRangeMin,
        fundingRangeMax,
        staffCount,
      },
    });
  } catch {
    return { error: "Failed to save profile. Please try again." };
  }

  revalidatePath("/settings/profile");
  return {};
}

// ── Save / update UserProfile ───────────────────────────────────────────────
export async function saveUserProfile(formData: FormData): Promise<ProfileResult> {
  const { workspaceId, userId } = await getWorkspaceContext();

  const location = (formData.get("location") as string)?.trim() || null;
  const region = (formData.get("region") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const linkedinUrl = (formData.get("linkedinUrl") as string)?.trim() || null;
  const thematicInterests = formData.getAll("thematicInterests") as string[];
  const geography = formData.getAll("geography") as string[];
  const keywords = (formData.get("keywords") as string)
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean) ?? [];

  const name =
    (formData.get("name") as string)?.trim() ||
    (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } })).name ||
    "";

  try {
    await db.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        workspaceId,
        name,
        location,
        region,
        bio,
        linkedinUrl,
        thematicInterests: JSON.stringify(thematicInterests),
        geography: JSON.stringify(geography),
        keywords: JSON.stringify(keywords),
      },
      update: {
        name,
        location,
        region,
        bio,
        linkedinUrl,
        thematicInterests: JSON.stringify(thematicInterests),
        geography: JSON.stringify(geography),
        keywords: JSON.stringify(keywords),
      },
    });
  } catch {
    return { error: "Failed to save profile. Please try again." };
  }

  revalidatePath("/settings/profile");
  return {};
}

// ── Mark onboarding complete ────────────────────────────────────────────────
// We store this in a simple boolean on the Workspace (or just check profile existence).
// For now the onboarding page calls saveOrgProfile / saveUserProfile then navigates to /dashboard.
