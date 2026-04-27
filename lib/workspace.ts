/**
 * Workspace context helpers.
 *
 * Every server action that touches tenant-owned data must call
 * getWorkspaceContext() at the top — it reads the current session,
 * finds the user's active workspace, and returns the workspaceId.
 *
 * NEVER accept workspaceId from client-submitted form data.
 */

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { WorkspaceRole } from "@/app/generated/prisma/client";

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

/**
 * Resolves the active workspace for the current session.
 * For now: returns the user's first workspace (OWNER first, then others).
 * Future: support multi-workspace switching via cookie/header.
 *
 * @throws if the user is not authenticated or has no workspace.
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id, acceptedAt: { not: null } },
    orderBy: [
      // Prefer OWNER, then ADMIN, then others
      { role: "asc" },
      { invitedAt: "asc" },
    ],
    select: { workspaceId: true, role: true },
  });

  if (!membership) {
    throw new Error("NO_WORKSPACE");
  }

  return {
    workspaceId: membership.workspaceId,
    userId: session.user.id,
    role: membership.role,
  };
}

/**
 * Like getWorkspaceContext() but additionally requires the user to have
 * at least ADMIN role in the workspace.
 */
export async function requireWorkspaceAdmin(): Promise<WorkspaceContext> {
  const ctx = await getWorkspaceContext();
  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return ctx;
}

/**
 * Require global ADMIN or SUPER_ADMIN role.
 * Used for the super-admin panel.
 */
export async function requireSuperAdmin(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session.user.id;
}
