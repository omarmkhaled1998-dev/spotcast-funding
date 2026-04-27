import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DocumentsClient } from "@/components/documents/documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const attachments = await db.attachment.findMany({
    include: {
      uploadedBy: { select: { name: true } },
      opportunity: { select: { id: true, title: true } },
      application: { select: { id: true, opportunity: { select: { title: true } } } },
      donor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  type Att = (typeof attachments)[number];

  // Serialize dates for client component
  const serialized = attachments.map((a: Att) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <DocumentsClient attachments={serialized} />;
}
