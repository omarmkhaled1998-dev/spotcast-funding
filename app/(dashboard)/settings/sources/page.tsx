import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { db } from "@/lib/db";
import { SourcesClient } from "./sources-client";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    redirect("/login");
  }

  const sources = await db.opportunitySource.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  // Last ingest log for status context
  const lastIngest = await db.ingestLog.findFirst({
    where: { workspaceId },
    orderBy: { startedAt: "desc" },
    select: { status: true, startedAt: true, imported: true, errors: true },
  });

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Opportunity Sources</h1>
      <p className="text-sm text-slate-500 mb-8">
        SpotCast scrapes these sources daily and scores every new opportunity against your profile.
        Add any website that lists grants, fellowships, or calls for proposals.
      </p>

      <SourcesClient
        sources={sources.map((s) => ({
          id: s.id,
          name: s.name,
          url: s.url,
          strategy: s.strategy,
          isActive: s.isActive,
          lastScrapedAt: s.lastScrapedAt?.toISOString() ?? null,
          lastSuccessAt: s.lastSuccessAt?.toISOString() ?? null,
          lastError: s.lastError ?? null,
          lastErrorAt: s.lastErrorAt?.toISOString() ?? null,
        }))}
        lastIngest={
          lastIngest
            ? {
                status: lastIngest.status,
                startedAt: lastIngest.startedAt?.toISOString() ?? null,
                imported: lastIngest.imported ?? 0,
              }
            : null
        }
      />
    </div>
  );
}
