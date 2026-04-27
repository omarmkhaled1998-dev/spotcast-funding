/**
 * Processes scraped opportunities: maps fields, scores, deduplicates, and saves to DB.
 */

import { db } from "@/lib/db";
import { scoreOpportunity } from "@/lib/scoring";
import { loadScoringProfile, DEFAULT_ORG_PROFILE } from "@/lib/scoring-profile";
import type { OrgScoringProfile } from "@/lib/scoring-profile";
import { toJsonArray } from "@/lib/utils";
import { sendImmediateAlert } from "@/lib/email/alert-sender";
import { analyzeOpportunity } from "@/lib/ai/analyze-opportunity";
import type { ScrapedOpportunity } from "./daleel-madani";

// Maps Daleel Madani sector names → SpotCast thematic areas
const SECTOR_THEME_MAP: Record<string, string[]> = {
  "media": ["media development", "community media"],
  "media and communication": ["media development", "communication", "digital media"],
  "media development": ["media development"],
  "journalism": ["journalism"],
  "investigative journalism": ["investigative journalism"],
  "digital media": ["digital media"],
  "digital": ["digital media"],
  "democracy": ["democracy"],
  "democratic governance": ["democracy"],
  "governance": ["democracy"],
  "civil society": ["civil society"],
  "civil society strengthening": ["civil society"],
  "human rights": ["human rights"],
  "human rights & protection": ["human rights"],
  "freedom of expression": ["freedom of expression", "media freedom"],
  "freedom of speech": ["freedom of expression"],
  "youth": ["youth"],
  "youth development": ["youth"],
  "community": ["community development", "local development"],
  "community development": ["community development"],
  "local development": ["local development"],
  "communication": ["communication"],
  "arts and culture": ["community media"],
  "culture": ["community media"],
  "gender": ["civil society"],
  "gender issues": ["civil society"],
  "women": ["civil society"],
  "education": ["media literacy"],
  "media literacy": ["media literacy"],
  "advocacy": ["civil society"],
  "peace": ["democracy"],
  "conflict": ["democracy"],
  "social justice": ["civil society"],
};

function mapSectorsToThemes(sectors: string[]): string[] {
  const themes = new Set<string>();
  sectors.forEach((sector) => {
    const s = sector.toLowerCase().trim();
    // Try exact match
    if (SECTOR_THEME_MAP[s]) {
      SECTOR_THEME_MAP[s].forEach((t) => themes.add(t));
      return;
    }
    // Try partial match
    Object.entries(SECTOR_THEME_MAP).forEach(([key, values]) => {
      if (s.includes(key) || key.includes(s)) {
        values.forEach((t) => themes.add(t));
      }
    });
  });
  return Array.from(themes);
}

function mapCallTypeToAppType(typeOfCall: string): string {
  const t = typeOfCall.toLowerCase();
  if (t.includes("expression of interest") || t.includes("eoi")) return "EOI";
  if (t.includes("concept note")) return "CONCEPT_NOTE";
  if (t.includes("request for applications") || t.includes("rfa")) return "RFA";
  if (t.includes("request for proposal") || t.includes("rfp")) return "RFP";
  if (t.includes("tender")) return "RFP";
  if (t.includes("open call") || t.includes("calls for proposals")) return "OPEN";
  return "OTHER";
}

function parseRemunerationRange(
  raw: string | null
): { min: number | null; max: number | null } {
  if (!raw) return { min: null, max: null };
  // "> 6000 (USD)" or "5000 - 10000 (USD)" or "Up to 50000"
  const numbers = raw.match(/[\d,]+/g)?.map((n) => parseInt(n.replace(/,/g, ""))) || [];
  if (numbers.length >= 2) return { min: numbers[0], max: numbers[1] };
  if (numbers.length === 1) {
    if (raw.includes(">") || raw.toLowerCase().includes("up to")) {
      return { min: null, max: numbers[0] };
    }
    return { min: numbers[0], max: null };
  }
  return { min: null, max: null };
}

function mapCountryToGeo(country: string): string[] {
  const c = country.toLowerCase();
  if (c.includes("lebanon")) return ["Lebanon"];
  if (c.includes("syria")) return ["Syria", "MENA"];
  if (c.includes("jordan")) return ["Jordan", "MENA"];
  if (c.includes("palestine") || c.includes("palestinian")) return ["Palestine", "MENA"];
  if (c.includes("mena") || c.includes("middle east") || c.includes("north africa"))
    return ["MENA"];
  if (c.includes("arab")) return ["Arab World", "MENA"];
  if (c.includes("regional")) return ["MENA", "Arab World"];
  if (!country || c.includes("global") || c.includes("international"))
    return ["Global"];
  return [country]; // keep as-is for other countries
}

export interface IngestStats {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function processAndSaveOpportunities(
  scraped: ScrapedOpportunity[],
  logId: string,
  onProgress?: (msg: string) => void,
  sourceName = "Daleel Madani",
  workspaceId?: string
): Promise<IngestStats> {
  const log = onProgress || console.log;
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Resolve workspaceId — fall back to the first workspace if not provided
  let wsId = workspaceId;
  if (!wsId) {
    const ws = await db.workspace.findFirst({ select: { id: true } });
    wsId = ws?.id;
  }
  if (!wsId) {
    errors.push("No workspace found — cannot save opportunities.");
    return { imported, skipped, errors };
  }

  // Load the workspace's scoring profile (org or user) for accurate scoring
  const rawProfile = await loadScoringProfile(wsId);
  const scoringProfile: OrgScoringProfile =
    rawProfile?.type === "ORG"
      ? rawProfile
      : {
          ...DEFAULT_ORG_PROFILE,
          // If the workspace has a user profile, adapt it for scoring
          thematicAreas: rawProfile?.type === "USER" ? rawProfile.thematicInterests : [],
          geography: rawProfile?.type === "USER" ? rawProfile.geography : [],
        };

  // Get or create a system user for auto-imports
  const systemUser = await db.user.findFirst({
    where: { email: "admin@spotcast.org" },
    select: { id: true },
  });

  for (const item of scraped) {
    try {
      // ── Deduplication (per workspace) ──────────────────────────────────────
      const existing = await db.opportunity.findFirst({
        where: {
          workspaceId: wsId,
          OR: [
            { sourceUrl: item.sourceUrl },
            ...(item.externalId ? [{ externalId: item.externalId }] : []),
          ],
        },
        select: { id: true },
      });

      if (existing) {
        log(`  Skip (duplicate): ${item.title}`);
        skipped++;
        continue;
      }

      // ── Find or create Donor ───────────────────────────────────────────────
      let donorId: string | null = null;
      if (item.organizationName) {
        const existingDonor = await db.donor.findFirst({
          where: {
            workspaceId: wsId,
            name: {
              contains: item.organizationName.split(" ").slice(0, 3).join(" "),
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

        if (existingDonor) {
          donorId = existingDonor.id;
        } else {
          const newDonor = await db.donor.create({
            data: {
              workspaceId: wsId,
              name: item.organizationName,
              type: "OTHER",
              website: item.organizationUrl || null,
              geographicFocus: toJsonArray(mapCountryToGeo(item.country)),
              relationshipStrength: "NONE",
              notes: `Auto-imported from ${sourceName}. Source: ${item.organizationUrl}`,
              createdById: systemUser?.id || null,
            },
          });
          donorId = newDonor.id;
          log(`  Created donor: ${item.organizationName}`);
        }
      }

      // ── Map fields ─────────────────────────────────────────────────────────
      const thematicAreas = mapSectorsToThemes(item.interventionSectors);
      const geography = mapCountryToGeo(item.country);
      const { min: fundMin, max: fundMax } = parseRemunerationRange(item.remunerationRange);
      const appType = mapCallTypeToAppType(item.typeOfCall);

      // ── Score ──────────────────────────────────────────────────────────────
      const scoringInput = {
        geography: toJsonArray(geography),
        thematicAreas: toJsonArray(thematicAreas),
        fundingAmountMin: fundMin,
        fundingAmountMax: fundMax,
        deadlineDate: item.deadlineParsed,
        applicationType: appType as Parameters<typeof scoreOpportunity>[0]["applicationType"],
        partnerRequired: false,
        languageRequirement: null,
        registrationRequirement: null,
      };

      const scoreResult = scoreOpportunity(scoringInput, scoringProfile);

      // ── Urgency ────────────────────────────────────────────────────────────
      let urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      if (item.deadlineParsed) {
        const days = Math.ceil((item.deadlineParsed.getTime() - Date.now()) / 86400000);
        if (days <= 7) urgency = "CRITICAL";
        else if (days <= 14) urgency = "HIGH";
        else if (days <= 30) urgency = "MEDIUM";
        else urgency = "LOW";
      }

      // ── Create Opportunity ─────────────────────────────────────────────────
      const opp = await db.opportunity.create({
        data: {
          workspaceId: wsId,
          title: item.title,
          donorId,
          sourceUrl: item.sourceUrl,
          sourceType: "SCRAPE",
          externalId: item.externalId,
          deadlineDate: item.deadlineParsed,
          geography: toJsonArray(geography),
          thematicAreas: toJsonArray(thematicAreas),
          fundingAmountMin: fundMin,
          fundingAmountMax: fundMax,
          currency: "USD",
          applicationType: appType as Parameters<typeof scoreOpportunity>[0]["applicationType"],
          summary: item.fullDescription ? item.fullDescription.substring(0, 500) : null,
          fullDescription: item.fullDescription,
          status: "NEEDS_REVIEW",
          urgencyLevel: urgency,
          suitabilityScore: scoreResult.score,
          fitLabel: scoreResult.fitLabel,
          scoreBreakdown: JSON.stringify(scoreResult.breakdown),
          dataConfidence: "IMPORTED",
          foundById: systemUser?.id || null,
          foundAt: new Date(),
          createdById: systemUser?.id || null,
        },
      });

      // ── Save scoring result ────────────────────────────────────────────────
      await db.scoringResult.create({
        data: {
          workspaceId: wsId,
          opportunityId: opp.id,
          totalScore: scoreResult.score,
          fitLabel: scoreResult.fitLabel,
          breakdown: JSON.stringify(scoreResult.breakdown),
          explanation: scoreResult.explanation,
          scoredBy: "AUTO",
        },
      });

      // ── Activity log ───────────────────────────────────────────────────────
      await db.activityLog.create({
        data: {
          workspaceId: wsId,
          action: `Auto-imported from ${sourceName}. Score: ${scoreResult.score}/100 (${scoreResult.fitLabel})`,
          opportunityId: opp.id,
          userId: systemUser?.id || null,
        },
      });

      // ── AI analysis for high-scoring opps (fire-and-forget) ───────────────
      if (scoreResult.score >= 50) {
        analyzeOpportunity(opp.id, wsId, {}).catch(() => {});
      }

      // ── Immediate alerts (fire-and-forget, non-blocking) ──────────────────
      sendImmediateAlert({
        id: opp.id,
        title: opp.title,
        suitabilityScore: opp.suitabilityScore,
        fitLabel: opp.fitLabel,
        deadlineDate: opp.deadlineDate,
        summary: opp.summary,
        workspaceId: wsId,
      }).catch(() => {}); // swallow — never interrupt ingest

      imported++;
      log(`  ✓ Imported [${scoreResult.fitLabel} ${scoreResult.score}/100]: ${item.title}`);
    } catch (err) {
      const msg = `Failed to save "${item.title}": ${(err as Error).message}`;
      errors.push(msg);
      log(`  ✗ ${msg}`);
    }
  }

  return { imported, skipped, errors };
}
