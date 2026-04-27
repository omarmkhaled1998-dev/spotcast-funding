/**
 * Personal / individual scoring engine.
 *
 * Scores each opportunity against a UserScoringProfile loaded from the DB.
 * No hardcoded profiles — all data comes from the caller.
 *
 * Score breakdown (max 100):
 *   - Keyword / theme overlap    0–35
 *   - Strategic priority boost   0–25
 *   - Geography fit              0–15
 *   - Type preference            0–10
 *   - Funder novelty             0–10
 *   - Deadline viability          0–5
 */

import { parseJsonArray } from "./utils";
import type { UserScoringProfile } from "./scoring-profile";

export interface PersonalScore {
  score: number;
  fitLabel: "strong" | "good" | "possible" | "weak";
  whyMatch: string;
  matchedKeywords: string[];
  matchedPriorities: string[];
}

export interface ScoringInput {
  title: string;
  description: string | null;
  thematicAreas: string;    // JSON array string
  geography: string;        // JSON array string
  typeOfCall: string | null;
  donorName: string | null | undefined;
  deadlineDate: Date | null | undefined;
  sourceUrl: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text.toLowerCase().replace(/[-_]/g, " ").trim();
}

function textContainsAny(text: string, terms: readonly string[]): string[] {
  const t = normalize(text);
  return terms.filter((k) => t.includes(normalize(k)));
}

function daysLeft(deadline: Date | null | undefined): number {
  if (!deadline) return 999;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

// ─── Score components ─────────────────────────────────────────────────────────

function scoreKeywords(
  title: string,
  description: string | null,
  themes: string[],
  sectors: string,
  sourceUrl: string | null,
  keywords: string[]
): { score: number; matched: string[] } {
  if (keywords.length === 0) return { score: 10, matched: [] }; // no profile = neutral
  const urlHints = sourceUrl
    ? sourceUrl.replace(/[-/]/g, " ").replace(/for9a\.com|earthjournalism\.net|daleel.madani\.org/g, "")
    : "";
  const haystack = [title, description || "", themes.join(" "), sectors, urlHints].join(" ");
  const matched = textContainsAny(haystack, keywords);
  const uniqueMatches = [...new Set(matched)];
  const raw = Math.min(uniqueMatches.length / 4, 1);
  return { score: Math.round(raw * 35), matched: uniqueMatches };
}

function scorePriorities(
  title: string,
  description: string | null,
  themes: string[],
  priorities: string[]
): { score: number; matched: string[] } {
  if (priorities.length === 0) return { score: 8, matched: [] }; // no profile = neutral
  const haystack = [title, description || "", themes.join(" ")].join(" ");
  const matched = textContainsAny(haystack, priorities);
  const unique = [...new Set(matched)];
  const raw = Math.min(unique.length / 2, 1);
  return { score: Math.round(raw * 25), matched: unique };
}

function scoreGeography(geo: string[], profileGeo: string[]): number {
  if (profileGeo.length === 0) return 9; // no preference = globally open
  const profileLower = profileGeo.map(normalize);
  const geoStr = geo.map(normalize).join(" ");

  const directMatch = profileLower.some((pg) => geoStr.includes(pg));
  const isMena = geoStr.includes("mena") || geoStr.includes("arab") || geoStr.includes("middle east");
  const isGlobal = geo.length === 0 || geoStr.includes("global") || geoStr.includes("international") || geoStr.includes("worldwide");

  if (directMatch) return 15;
  if (isMena) return 12;
  if (isGlobal) return 9;
  return 2;
}

function scoreType(oppType: string | null, title: string): number {
  const t = normalize(oppType || "") + " " + normalize(title);
  if (t.includes("fellowship")) return 10;
  if (t.includes("award") || t.includes("prize")) return 9;
  if (t.includes("residency") || t.includes("exchange")) return 8;
  if (t.includes("competition")) return 8;
  if (t.includes("story grant") || t.includes("grant")) return 8;
  if (t.includes("conference") || t.includes("festival")) return 7;
  if (t.includes("workshop") || t.includes("training")) return 6;
  return 5;
}

function scoreFunderNovelty(donorName: string | null | undefined, existingFunders: string[]): number {
  if (!donorName || existingFunders.length === 0) return 7;
  const name = normalize(donorName);
  const isExisting = existingFunders.some((f) => name.includes(normalize(f)));
  return isExisting ? 3 : 10;
}

function scoreDeadline(deadline: Date | null | undefined): number {
  const days = daysLeft(deadline);
  if (days < 0) return 0;
  if (days <= 7) return 2;
  if (days <= 30) return 5;
  if (days <= 90) return 4;
  if (days <= 180) return 3;
  return 2;
}

function buildWhyMatch(
  matchedKeywords: string[],
  matchedPriorities: string[],
  geoScore: number,
  oppType: string | null,
  funderScore: number
): string {
  const parts: string[] = [];

  if (matchedPriorities.length > 0) {
    const list = matchedPriorities.slice(0, 2).map((p) => p.replace(/-/g, " "));
    parts.push(`Directly supports your active priority: **${list.join("** and **")}**`);
  }

  if (matchedKeywords.length >= 3) {
    const kws = matchedKeywords.slice(0, 3).map((k) => k.replace(/-/g, " "));
    parts.push(`Strong keyword overlap with your interests (${kws.join(", ")})`);
  } else if (matchedKeywords.length > 0) {
    parts.push(`Matches your interest in ${matchedKeywords[0].replace(/-/g, " ")}`);
  }

  if (geoScore >= 12) parts.push("Open to your target region");
  else if (geoScore >= 9) parts.push("Globally open — you are eligible");

  const t = (oppType || "").toLowerCase();
  if (t.includes("fellowship")) parts.push("Fellowship format fits your personal development goals");
  if (t.includes("award") || t.includes("prize")) parts.push("You can submit existing work");

  if (funderScore === 10) parts.push("New funder — fresh opportunity");
  else if (funderScore === 3) parts.push("Existing funder — you already have a track record");

  if (parts.length === 0) return "Potential thematic overlap with your work.";
  return parts.join(". ") + ".";
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Score an opportunity against a user profile from the DB.
 * Pass profile=null to get a neutral score (no profile configured).
 */
export function scoreForUser(
  opp: ScoringInput,
  profile: UserScoringProfile | null
): PersonalScore {
  const themes = parseJsonArray(opp.thematicAreas);
  const geo = parseJsonArray(opp.geography);

  const keywords = profile?.keywords ?? [];
  const priorities = profile?.strategicPriorities ?? [];
  const existingFunders = profile?.existingFunders ?? [];
  const profileGeo = profile?.geography ?? [];

  const { score: kwScore, matched: kws } = scoreKeywords(
    opp.title, opp.description, themes, opp.thematicAreas, opp.sourceUrl, keywords
  );
  const { score: priScore, matched: matchedPriorities } = scorePriorities(
    opp.title, opp.description, themes, priorities
  );
  const geoScore = scoreGeography(geo, profileGeo);
  const typeScore = scoreType(opp.typeOfCall, opp.title);
  const funderScore = scoreFunderNovelty(opp.donorName, existingFunders);
  const deadlineScore = scoreDeadline(opp.deadlineDate);

  const total = Math.min(
    kwScore + priScore + geoScore + typeScore + funderScore + deadlineScore,
    100
  );

  const fitLabel: PersonalScore["fitLabel"] =
    total >= 70 ? "strong" : total >= 50 ? "good" : total >= 30 ? "possible" : "weak";

  const whyMatch = buildWhyMatch(kws, matchedPriorities, geoScore, opp.typeOfCall, funderScore);

  return { score: total, fitLabel, whyMatch, matchedKeywords: kws, matchedPriorities };
}

