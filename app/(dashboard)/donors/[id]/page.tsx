import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { DonorDetail } from "@/components/donors/donor-detail";

export const dynamic = "force-dynamic";

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const donor = await db.donor.findUnique({
    where: { id },
    include: {
      contacts: true,
      opportunities: {
        include: { decision: true },
        orderBy: { createdAt: "desc" },
      },
      applications: {
        include: { opportunity: true },
        orderBy: { createdAt: "desc" },
      },
      relationshipLogs: {
        include: { loggedBy: true },
        orderBy: { date: "desc" },
      },
      donorNotes: {
        include: { author: true },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!donor) notFound();
  return <DonorDetail donor={donor} currentUserId={session.user?.id || ""} />;
}
