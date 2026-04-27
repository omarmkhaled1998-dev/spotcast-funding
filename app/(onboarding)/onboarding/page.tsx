import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Radio } from "lucide-react";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id, acceptedAt: { not: null } },
    include: {
      workspace: {
        include: {
          sources: { where: { isActive: true }, take: 1 },
        },
      },
    },
  });

  if (!membership) redirect("/login");

  // `membership` from `findFirst` with `include` carries workspace as a relation
  const workspace = (membership as any).workspace as {
    id: string;
    name: string;
    type: string;
    sources: { id: string }[];
  };

  // Already onboarded = has at least one active source configured
  const alreadyOnboarded = workspace.sources.length > 0;
  if (alreadyOnboarded) redirect("/opportunities");

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4">
            <Radio size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome to SpotCast
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Let's find grants for {workspace.name}.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <OnboardingForm
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            wsType={workspace.type as "ORG" | "INDIVIDUAL"}
            userId={session.user.id}
          />
        </div>
      </div>
    </div>
  );
}
