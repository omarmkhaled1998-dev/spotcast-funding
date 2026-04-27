"use server";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { revalidatePath } from "next/cache";
import type { NoteType } from "@/app/generated/prisma/client";

type SubjectType = "opportunity" | "application" | "donor";

export async function createNote(
  subjectType: SubjectType,
  subjectId: string,
  data: FormData
) {
  const { workspaceId, userId } = await getWorkspaceContext();

  await db.note.create({
    data: {
      workspaceId,
      noteType: (data.get("noteType") as NoteType) || "GENERAL",
      body: data.get("body") as string,
      isPinned: data.get("isPinned") === "true",
      authorId: userId,
      ...(subjectType === "opportunity" && { opportunityId: subjectId }),
      ...(subjectType === "application" && { applicationId: subjectId }),
      ...(subjectType === "donor" && { donorId: subjectId }),
    },
  });

  revalidatePath(
    subjectType === "opportunity"
      ? `/opportunities/${subjectId}`
      : subjectType === "application"
      ? `/applications/${subjectId}`
      : `/donors/${subjectId}`
  );
  return { success: true };
}

export async function togglePinNote(noteId: string) {
  const { workspaceId } = await getWorkspaceContext();
  const note = await db.note.findFirst({ where: { id: noteId, workspaceId } });
  if (!note) return;
  await db.note.update({ where: { id: noteId }, data: { isPinned: !note.isPinned } });
  revalidatePath("/opportunities");
  revalidatePath("/applications");
  revalidatePath("/donors");
  return { success: true };
}

export async function deleteNote(noteId: string) {
  const { workspaceId } = await getWorkspaceContext();
  await db.note.findFirst({ where: { id: noteId, workspaceId } });
  await db.note.delete({ where: { id: noteId } });
  revalidatePath("/opportunities");
  revalidatePath("/applications");
  revalidatePath("/donors");
  return { success: true };
}
