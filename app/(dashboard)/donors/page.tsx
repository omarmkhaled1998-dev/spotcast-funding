import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { redirect } from "next/navigation";
import { DonorsClient } from "@/components/donors/donors-client";

export const dynamic = "force-dynamic";

export default async function DonorsPage() {
  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const donors = await db.donor.findMany({
    where: { workspaceId },
    include: {
      _count: { select: { opportunities: true, applications: true } },
      contacts: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return <DonorsClient donors={donors} />;
}
