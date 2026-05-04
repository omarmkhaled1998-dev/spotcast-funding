/**
 * POST /api/rescore
 *
 * Re-scores all opportunities in the workspace using the current scoring profile.
 * Useful after:
 *  - Updating the org profile (geography, thematic areas, funding range)
 *  - Improvements to the scoring engine (e.g. new hard disqualifiers)
 *
 * Returns SSE stream with live progress.
 */

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getWorkspaceContext } from "@/lib/workspace";
import { scoreOpportunity } from "@/lib/scoring";
import { loadScoringProfile, DEFAULT_ORG_PROFILE } from "@/lib/scoring-profile";
import type { OrgScoringProfile } from "@/lib/scoring-profile";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let workspaceId: string;
  try {
    ({ workspaceId } = await getWorkspaceContext());
  } catch {
    return new Response("No workspace found", { status: 403 });
  }

  // Load scoring profile
  const rawProfile = await loadScoringProfile(workspaceId);
  const scoringProfile: OrgScoringProfile =
    rawProfile?.type === "ORG"
      ? rawProfile
      : {
          ...DEFAULT_ORG_PROFILE,
          thematicAreas: rawProfile?.type === "USER" ? rawProfile.thematicInterests : [],
          geography: rawProfile?.type === "USER" ? rawProfile.geography : [],
        };

  // Stream response
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const send = async (msg: string) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify({ msg })}\n\n`));
    } catch { /* client disconnected */ }
  };

  (async () => {
    try {
      // Fetch all opportunities for this workspace
      const opps = await db.opportunity.findMany({
        where: { workspaceId },
        include: { donor: true },
        orderBy: { createdAt: "asc" },
      });

      await send(`🔄 Re-scoring ${opps.length} opportunities...`);

      let updated = 0;
      let unchanged = 0;

      for (const opp of opps) {
        try {
          const donorRel = (opp.donor as { relationshipStrength?: string } | null)
            ?.relationshipStrength ?? "NONE";

          const result = scoreOpportunity(opp, scoringProfile, donorRel);

          // Only update if score or label changed
          if (
            opp.suitabilityScore === result.score &&
            opp.fitLabel === result.fitLabel
          ) {
            unchanged++;
            continue;
          }

          await db.opportunity.update({
            where: { id: opp.id },
            data: {
              suitabilityScore: result.score,
              fitLabel: result.fitLabel,
              scoreBreakdown: JSON.stringify({
                ...result.breakdown,
                ...(result.disqualified ? { _disqualified: result.disqualified } : {}),
              }),
            },
          });

          updated++;
          if (updated % 10 === 0) {
            await send(`  ✓ ${updated} updated so far...`);
          }
        } catch {
          // Skip individual failures silently
        }
      }

      await send(`\n✅ Done! Updated: ${updated}, Unchanged: ${unchanged}`);
      await send(`__DONE__:${JSON.stringify({ updated, unchanged, total: opps.length })}`);
    } catch (err) {
      await send(`❌ Error: ${(err as Error).message}`);
      await send(`__DONE__:${JSON.stringify({ updated: 0, unchanged: 0, total: 0 })}`);
    } finally {
      await writer.close().catch(() => {});
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
