"use server";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { Role } from "@/app/generated/prisma/client";

export async function createUser(data: FormData) {
  await requireSuperAdmin();

  const name = data.get("name") as string;
  const email = data.get("email") as string;
  const password = data.get("password") as string;
  const role = (data.get("role") as Role) || "EDITOR";

  const hashed = await bcrypt.hash(password, 12);
  await db.user.create({ data: { name, email, password: hashed, role } });

  revalidatePath("/admin");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireSuperAdmin();
  await db.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/admin");
  return { success: true };
}

export async function changeUserRole(userId: string, role: Role) {
  await requireSuperAdmin();
  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin");
  return { success: true };
}

// ─── Super-admin workspace management ────────────────────────────────────────

export async function listAllWorkspaces() {
  await requireSuperAdmin();
  return db.workspace.findMany({
    include: {
      subscription: true,
      members: { include: { user: { select: { name: true, email: true } } } },
      _count: { select: { opportunities: true, applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkspaceDetail(workspaceId: string) {
  await requireSuperAdmin();
  return db.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      subscription: true,
      orgProfile: true,
      members: { include: { user: true } },
      sources: true,
      ingestLogs: { orderBy: { startedAt: "desc" }, take: 10 },
    },
  });
}
