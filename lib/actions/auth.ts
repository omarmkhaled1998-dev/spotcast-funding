"use server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { seedDemoOpportunities } from "@/lib/demo-seed";

export interface SignupResult {
  error?: string;
}

export async function signup(formData: FormData): Promise<SignupResult> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const workspaceName = (formData.get("workspaceName") as string)?.trim();
  const workspaceType = (formData.get("workspaceType") as "ORG" | "INDIVIDUAL") || "ORG";

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!name || !email || !password || !workspaceName) {
    return { error: "All fields are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  // ── Email uniqueness ────────────────────────────────────────────────────────
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // ── Create user ─────────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { name, email, password: hashed, role: "ADMIN" },
  });

  // ── Create workspace ────────────────────────────────────────────────────────
  const slug = workspaceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 48);

  // Ensure slug uniqueness by appending a short random suffix if needed
  const slugBase = slug || "workspace";
  let finalSlug = slugBase;
  const slugExists = await db.workspace.findUnique({ where: { slug: slugBase }, select: { id: true } });
  if (slugExists) {
    finalSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const workspace = await db.workspace.create({
    data: { name: workspaceName, slug: finalSlug, type: workspaceType },
  });

  // ── Link user as OWNER ──────────────────────────────────────────────────────
  await db.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER",
      acceptedAt: new Date(),
    },
  });

  // ── Create stub profile ─────────────────────────────────────────────────────
  if (workspaceType === "ORG") {
    await db.orgProfile.create({
      data: {
        workspaceId: workspace.id,
        orgName: workspaceName,
      },
    });
  } else {
    await db.userProfile.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        name,
      },
    });
  }

  // ── Seed demo opportunities (fire-and-forget) ──────────────────────────────
  seedDemoOpportunities(workspace.id).catch(() => {});

  // ── Auto sign-in after signup ───────────────────────────────────────────────
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    // If auto-sign-in fails, redirect to login — user was created successfully
  }

  redirect("/onboarding");
}
