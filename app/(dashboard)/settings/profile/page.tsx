import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceContext } from "@/lib/workspace";
import { parseJsonArray } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ProfileSettingsClient } from "./profile-settings-client";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { workspaceId, userId } = await getWorkspaceContext();

  const [workspace, orgProfile, userProfile] = await Promise.all([
    db.workspace.findUnique({ where: { id: workspaceId } }),
    db.orgProfile.findUnique({ where: { workspaceId } }),
    db.userProfile.findUnique({ where: { userId } }),
  ]);

  const wsType = (workspace?.type ?? "INDIVIDUAL") as "ORG" | "INDIVIDUAL";

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Profile settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your profile is used to score and match funding opportunities.
        </p>
      </div>

      <ProfileSettingsClient
        wsType={wsType}
        workspaceName={workspace?.name ?? "My Workspace"}
        userName={session.user.name ?? ""}
        orgProfile={
          orgProfile
            ? {
                orgType: orgProfile.orgType ?? "",
                mission: orgProfile.mission ?? "",
                vision: orgProfile.vision ?? "",
                previousWork: orgProfile.previousWork ?? "",
                contextDocuments: orgProfile.contextDocuments ?? "",
                docExtracts: orgProfile.docExtracts ?? "[]",
                thematicAreas: parseJsonArray(orgProfile.thematicAreas),
                geography: parseJsonArray(orgProfile.geography),
                fundingRangeMin: orgProfile.fundingRangeMin ?? undefined,
                fundingRangeMax: orgProfile.fundingRangeMax ?? undefined,
                website: orgProfile.website ?? "",
                registrationCountry: orgProfile.registrationCountry ?? "",
              }
            : null
        }
        userProfile={
          userProfile
            ? {
                name: userProfile.name,
                location: userProfile.location ?? "",
                region: userProfile.region ?? "",
                thematicInterests: parseJsonArray(userProfile.thematicInterests),
                geography: parseJsonArray(userProfile.geography),
                keywords: parseJsonArray(userProfile.keywords).join(", "),
                bio: userProfile.bio ?? "",
                linkedinUrl: userProfile.linkedinUrl ?? "",
              }
            : null
        }
      />
    </div>
  );
}
