"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import { toJsonArray } from "@/lib/utils";

export async function createDonor(data: FormData) {
  const { workspaceId, userId } = await getWorkspaceContext();

  const focusAreas = data.getAll("focusAreas") as string[];
  const geographicFocus = data.getAll("geographicFocus") as string[];

  const donor = await db.donor.create({
    data: {
      workspaceId,
      name: data.get("name") as string,
      type: (data.get("type") as "BILATERAL") || "OTHER",
      website: (data.get("website") as string) || null,
      countryOfOrigin: (data.get("countryOfOrigin") as string) || null,
      focusAreas: toJsonArray(focusAreas),
      geographicFocus: toJsonArray(geographicFocus),
      fundingRangeMin: data.get("fundingRangeMin") ? Number(data.get("fundingRangeMin")) : null,
      fundingRangeMax: data.get("fundingRangeMax") ? Number(data.get("fundingRangeMax")) : null,
      typicalGrantDurationMonths: data.get("typicalGrantDurationMonths")
        ? Number(data.get("typicalGrantDurationMonths"))
        : null,
      relationshipStrength: (data.get("relationshipStrength") as "NONE") || "NONE",
      preferredFraming: (data.get("preferredFraming") as string) || null,
      notes: (data.get("notes") as string) || null,
      createdById: userId,
    },
  });

  revalidatePath("/donors");
  return { success: true, id: donor.id };
}

export async function updateDonor(id: string, data: FormData) {
  const { workspaceId } = await getWorkspaceContext();
  await db.donor.findFirstOrThrow({ where: { id, workspaceId } });

  const focusAreas = data.getAll("focusAreas") as string[];
  const geographicFocus = data.getAll("geographicFocus") as string[];

  await db.donor.update({
    where: { id },
    data: {
      name: data.get("name") as string,
      type: (data.get("type") as "BILATERAL") || "OTHER",
      website: (data.get("website") as string) || null,
      countryOfOrigin: (data.get("countryOfOrigin") as string) || null,
      focusAreas: toJsonArray(focusAreas),
      geographicFocus: toJsonArray(geographicFocus),
      fundingRangeMin: data.get("fundingRangeMin") ? Number(data.get("fundingRangeMin")) : null,
      fundingRangeMax: data.get("fundingRangeMax") ? Number(data.get("fundingRangeMax")) : null,
      typicalGrantDurationMonths: data.get("typicalGrantDurationMonths")
        ? Number(data.get("typicalGrantDurationMonths"))
        : null,
      relationshipStrength: (data.get("relationshipStrength") as "NONE") || "NONE",
      preferredFraming: (data.get("preferredFraming") as string) || null,
      notes: (data.get("notes") as string) || null,
    },
  });

  revalidatePath(`/donors/${id}`);
  revalidatePath("/donors");
  return { success: true };
}

export async function addDonorContact(donorId: string, data: FormData) {
  const { workspaceId } = await getWorkspaceContext();
  await db.donor.findFirstOrThrow({ where: { id: donorId, workspaceId } });

  await db.donorContact.create({
    data: {
      donorId,
      workspaceId,
      name: data.get("name") as string,
      title: (data.get("title") as string) || null,
      email: (data.get("email") as string) || null,
      phone: (data.get("phone") as string) || null,
      notes: (data.get("notes") as string) || null,
      isPrimary: data.get("isPrimary") === "true",
    },
  });

  revalidatePath(`/donors/${donorId}`);
  return { success: true };
}

export async function addRelationshipLog(donorId: string, data: FormData) {
  const { workspaceId, userId } = await getWorkspaceContext();
  await db.donor.findFirstOrThrow({ where: { id: donorId, workspaceId } });

  const date = new Date(data.get("date") as string);

  await db.relationshipLog.create({
    data: {
      workspaceId,
      donorId,
      interactionType: (data.get("interactionType") as "MEETING") || "OTHER",
      date,
      summary: (data.get("summary") as string) || null,
      loggedById: userId,
    },
  });

  await db.donor.update({
    where: { id: donorId },
    data: { lastInteractionDate: date },
  });

  revalidatePath(`/donors/${donorId}`);
  return { success: true };
}

export async function deleteDonor(id: string) {
  const { workspaceId } = await getWorkspaceContext();
  await db.donor.findFirstOrThrow({ where: { id, workspaceId } });
  await db.donor.delete({ where: { id } });
  revalidatePath("/donors");
  return { success: true };
}
