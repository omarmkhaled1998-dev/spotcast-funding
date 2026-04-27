"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import type { ScrapeStrategy } from "@/app/generated/prisma/client";

export interface SourceResult {
  error?: string;
}

// ── Add a new source ──────────────────────────────────────────────────────────

export async function addSource(formData: FormData): Promise<SourceResult> {
  const { workspaceId } = await getWorkspaceContext();

  const name = (formData.get("name") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const strategy = ((formData.get("strategy") as string) || "AUTO") as ScrapeStrategy;

  if (!name) return { error: "Source name is required." };
  if (!url) return { error: "URL is required." };

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return { error: "Please enter a valid URL including https://." };
  }

  // Limit sources per plan (enforced loosely here — full enforcement in subscription middleware)
  const existing = await db.opportunitySource.count({ where: { workspaceId } });
  if (existing >= 20) {
    return { error: "You've reached the maximum number of sources for this workspace." };
  }

  // Prevent duplicates
  const duplicate = await db.opportunitySource.findFirst({
    where: { workspaceId, url },
    select: { id: true },
  });
  if (duplicate) return { error: "This URL is already added as a source." };

  await db.opportunitySource.create({
    data: { workspaceId, name, url, strategy },
  });

  revalidatePath("/settings/sources");
  return {};
}

// ── Toggle source active/inactive ────────────────────────────────────────────

export async function toggleSource(id: string): Promise<SourceResult> {
  const { workspaceId } = await getWorkspaceContext();

  const source = await db.opportunitySource.findFirst({
    where: { id, workspaceId },
    select: { id: true, isActive: true },
  });
  if (!source) return { error: "Source not found." };

  await db.opportunitySource.update({
    where: { id },
    data: { isActive: !source.isActive },
  });

  revalidatePath("/settings/sources");
  return {};
}

// ── Delete a source ───────────────────────────────────────────────────────────

export async function deleteSource(id: string): Promise<SourceResult> {
  const { workspaceId } = await getWorkspaceContext();

  const source = await db.opportunitySource.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });
  if (!source) return { error: "Source not found." };

  await db.opportunitySource.delete({ where: { id } });

  revalidatePath("/settings/sources");
  return {};
}

// ── Update source strategy ────────────────────────────────────────────────────

export async function updateSourceStrategy(
  id: string,
  strategy: ScrapeStrategy
): Promise<SourceResult> {
  const { workspaceId } = await getWorkspaceContext();

  const source = await db.opportunitySource.findFirst({
    where: { id, workspaceId },
    select: { id: true },
  });
  if (!source) return { error: "Source not found." };

  await db.opportunitySource.update({ where: { id }, data: { strategy } });

  revalidatePath("/settings/sources");
  return {};
}
