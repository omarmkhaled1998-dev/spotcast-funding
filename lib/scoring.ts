import type { Opportunity, FitLabel } from "@/app/generated/prisma/client";
import { parseJsonArray } from "./utils";
import type { OrgScoringProfile } from "./scoring-profile";

export interface ScoreBreakdown {
  geography: { score: number; max: number; reason: string };
  thematicFit: { score: number; max: number; reason: string };
  fundingSize: { score: number; max: number; reason: string };
  timeline: { score: number; max: number; reason: string };
  complexity: { score: number; max: number; reason: string };
  relationship: { score: number; max: number; reason: string };
  partnerReq: { score: number; max: number; reason: string };
  language: { score: number; max: number; reason: string };
  registration: { score: number; max: number; reason: string };
  strategic: { score: number; max: number; reason: string };
}

export interface ScoringOutput {
  score: number;
  fitLabel: FitLabel;
  breakdown: ScoreBreakdown;
  explanation: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
  /** Hard disqualifier reason — if set, score is forced to 0 regardless of other factors */
  disqualified?: string;
}

function daysUntilDeadline(deadline: Date | null | undefined): number {
  if (!deadline) return 999;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

/**
 * Score an opportunity against an org profile from the DB.
 *
 * @param opp        Opportunity fields needed for scoring
 * @param profile    OrgScoringProfile loaded from DB (themes, geography, budget range)
 * @param donorRelationship  Relationship strength string from Donor record (optional)
 */
export function scoreOpportunity(
  opp: Pick<
    Opportunity,
    | "geography"
    | "thematicAreas"
    | "fundingAmountMin"
    | "fundingAmountMax"
    | "deadlineDate"
    | "applicationType"
    | "partnerRequired"
    | "languageRequirement"
    | "registrationRequirement"
  >,
  profile?: OrgScoringProfile,
  donorRelationship?: string
): ScoringOutput {

  const geo = parseJsonArray(opp.geography).map((g) => g.toLowerCase());
  const themes = parseJsonArray(opp.thematicAreas).map((t) => t.toLowerCase());
  const days = daysUntilDeadline(opp.deadlineDate);
  const relationship = donorRelationship || "NONE";

  // ── Hard disqualifiers — checked before scoring ─────────────────────────────

  // 1. Deadline has passed
  if (days < 0) {
    const breakdown: ScoreBreakdown = {
      geography: { score: 0, max: 20, reason: "N/A" },
      thematicFit: { score: 0, max: 20, reason: "N/A" },
      fundingSize: { score: 0, max: 10, reason: "N/A" },
      timeline: { score: 0, max: 10, reason: `Deadline passed ${Math.abs(days)} days ago` },
      complexity: { score: 0, max: 10, reason: "N/A" },
      relationship: { score: 0, max: 10, reason: "N/A" },
      partnerReq: { score: 0, max: 8, reason: "N/A" },
      language: { score: 0, max: 5, reason: "N/A" },
      registration: { score: 0, max: 4, reason: "N/A" },
      strategic: { score: 0, max: 3, reason: "N/A" },
    };
    return {
      score: 0,
      fitLabel: "NOT_SUITABLE",
      breakdown,
      explanation: `Deadline passed ${Math.abs(days)} days ago — no longer open for applications.`,
      strengths: [],
      risks: [`Deadline passed ${Math.abs(days)} days ago`],
      recommendation: "Archive this opportunity. The application window has closed.",
      disqualified: `Deadline passed ${Math.abs(days)} days ago`,
    };
  }

  // 2. Geographic exclusion — opportunity targets specific countries/regions
  //    that are all outside the profile's geography (and not global/regional)
  const profileGeoLower = (profile?.geography ?? []).map((g) => g.toLowerCase());
  const geoDisqualified =
    profileGeoLower.length > 0 &&
    geo.length > 0 &&
    !geo.some((g) =>
      g.includes("global") ||
      g.includes("worldwide") ||
      g.includes("international") ||
      g.includes("mena") ||
      g.includes("arab") ||
      g.includes("middle east") ||
      g.includes("north africa") ||
      g.includes("regional") ||
      profileGeoLower.some((pg) => g.includes(pg) || pg.includes(g))
    );

  const breakdown: ScoreBreakdown = {
    geography: scoreGeography(geo, profile?.geography ?? []),
    thematicFit: scoreThemes(themes, profile?.thematicAreas ?? []),
    fundingSize: scoreFundingSize(
      opp.fundingAmountMin,
      opp.fundingAmountMax,
      profile?.fundingRangeMin ?? 20000,
      profile?.fundingRangeMax ?? 300000
    ),
    timeline: scoreTimeline(days),
    complexity: scoreComplexity(opp.applicationType),
    relationship: scoreRelationship(relationship),
    partnerReq: scorePartner(opp.partnerRequired),
    language: scoreLanguage(opp.languageRequirement),
    registration: scoreRegistration(opp.registrationRequirement),
    strategic: { score: 2, max: 3, reason: "Default strategic value" },
  };

  // If geo-excluded, force score to 0 regardless of thematic/other fit
  if (geoDisqualified) {
    const geoTargets = geo.join(", ");
    return {
      score: 0,
      fitLabel: "NOT_SUITABLE",
      breakdown: { ...breakdown, geography: { score: 0, max: 20, reason: `Targets ${geoTargets} — outside your operational geography` } },
      explanation: `Geographic mismatch: this opportunity targets ${geoTargets}, which is outside your operational area. Not eligible to apply even with strong thematic fit.`,
      strengths: [],
      risks: [`Targets ${geoTargets} — outside your operational geography`],
      recommendation: "Do not apply. Geographic eligibility criteria exclude your organization.",
      disqualified: `Outside operational geography (targets ${geoTargets})`,
    };
  }

  const total = Object.values(breakdown).reduce((sum, d) => sum + d.score, 0);

  const fitLabel: FitLabel =
    total >= 75 ? "SUITABLE" : total >= 50 ? "MAYBE" : "NOT_SUITABLE";

  const orgName = profile?.name ?? "your organization";
  const strengths: string[] = [];
  const risks: string[] = [];

  if (breakdown.geography.score >= 14) strengths.push(breakdown.geography.reason);
  else if (breakdown.geography.score < 8) risks.push("Geographic eligibility unclear or excluded");

  if (breakdown.thematicFit.score >= 14) strengths.push(breakdown.thematicFit.reason);
  else if (breakdown.thematicFit.score < 7) risks.push(`Weak thematic match with ${orgName}`);

  if (breakdown.relationship.score >= 7) strengths.push(breakdown.relationship.reason);

  if (breakdown.timeline.score < 6) risks.push(`Only ${days} days until deadline — very tight`);
  if (breakdown.partnerReq.score === 0) risks.push("Partnership required but partner not confirmed");
  if (breakdown.complexity.score <= 5) risks.push("High-complexity application type");

  const recommendation =
    fitLabel === "SUITABLE"
      ? `Pursue immediately. Score: ${total}/100. Assign a lead today.`
      : fitLabel === "MAYBE"
      ? `Review carefully before committing. Score: ${total}/100. Hold a go/no-go discussion.`
      : `Not recommended to apply. Score: ${total}/100. Archive with reason documented.`;

  const explanation = [
    `Score: ${total}/100 — ${fitLabel.replace("_", " ")}.`,
    strengths.length ? `Strong fit: ${strengths.join("; ")}.` : "",
    risks.length ? `Risks: ${risks.join("; ")}.` : "",
    recommendation,
  ]
    .filter(Boolean)
    .join(" ");

  return { score: total, fitLabel, breakdown, explanation, strengths, risks, recommendation };
}

function scoreGeography(
  geo: string[],
  profileGeo: string[]
): ScoreBreakdown["geography"] {
  const profileGeoLower = profileGeo.map((g) => g.toLowerCase());

  // Check if opportunity explicitly matches any of the profile's target regions
  const directMatch = geo.some((g) =>
    profileGeoLower.some((pg) => g.includes(pg) || pg.includes(g))
  );
  const isGlobal =
    geo.length === 0 ||
    geo.some((g) => g.includes("global") || g.includes("worldwide") || g.includes("international"));
  const isMena = geo.some((g) =>
    ["mena", "arab", "middle east", "north africa"].some((k) => g.includes(k))
  );

  if (directMatch)
    return { score: 20, max: 20, reason: "Target region explicitly eligible" };
  if (isMena && profileGeoLower.some((pg) => ["mena", "arab", "middle east", "north africa", "regional"].some(k => pg.includes(k))))
    return { score: 14, max: 20, reason: "MENA region eligible" };
  if (isGlobal)
    return { score: 8, max: 20, reason: "Global/open eligibility" };
  return { score: 0, max: 20, reason: "Geographic region does not match your target areas" };
}

function scoreThemes(
  themes: string[],
  profileThemes: string[]
): ScoreBreakdown["thematicFit"] {
  const profileLower = profileThemes.map((t) => t.toLowerCase());
  const matches = themes.filter((t) =>
    profileLower.some((k) => t.includes(k) || k.includes(t))
  ).length;

  if (matches >= 3)
    return { score: 20, max: 20, reason: `Strong thematic alignment (${matches} matching areas)` };
  if (matches === 2)
    return { score: 14, max: 20, reason: `Good thematic fit (${matches} matching areas)` };
  if (matches === 1)
    return { score: 7, max: 20, reason: `Partial thematic fit (${matches} matching area)` };

  // If profile has no themes set, give partial credit
  if (profileLower.length === 0)
    return { score: 5, max: 20, reason: "No thematic profile set — update your profile for better scoring" };

  return { score: 0, max: 20, reason: "No clear thematic alignment with your profile" };
}

function scoreFundingSize(
  min: number | null | undefined,
  max: number | null | undefined,
  profileMin: number,
  profileMax: number
): ScoreBreakdown["fundingSize"] {
  if (!min && !max) return { score: 5, max: 10, reason: "Funding amount not specified" };

  const grantMin = min || 0;
  const grantMax = max || min || 0;

  const overlap = grantMax >= profileMin * 0.5 && grantMin <= profileMax * 1.5;
  const goodFit = grantMax >= profileMin && grantMin <= profileMax;

  if (goodFit) return { score: 10, max: 10, reason: "Funding amount within your target range" };
  if (overlap) return { score: 6, max: 10, reason: "Funding amount near your target range" };
  return { score: 2, max: 10, reason: "Funding amount outside your typical range" };
}

function scoreTimeline(days: number): ScoreBreakdown["timeline"] {
  if (days >= 30) return { score: 10, max: 10, reason: "Sufficient preparation time (30+ days)" };
  if (days >= 15) return { score: 6, max: 10, reason: `Moderate preparation window (${days} days)` };
  if (days >= 7) return { score: 2, max: 10, reason: `Short preparation window (${days} days)` };
  return { score: 0, max: 10, reason: `Very short deadline (${days} days) — high risk` };
}

function scoreComplexity(appType: string | null | undefined): ScoreBreakdown["complexity"] {
  const map: Record<string, number> = {
    EOI: 10,
    OPEN: 8,
    CONCEPT_NOTE: 8,
    INVITED: 8,
    RFA: 5,
    RFP: 5,
    OTHER: 5,
  };
  const score = map[appType || "OTHER"] ?? 5;
  const labels: Record<number, string> = {
    10: "Simple expression of interest",
    8: "Standard application type",
    5: "Complex formal proposal required",
  };
  return { score, max: 10, reason: labels[score] || "Application complexity unknown" };
}

function scoreRelationship(strength: string): ScoreBreakdown["relationship"] {
  const map: Record<string, number> = {
    STRONG: 10, ACTIVE: 10, CONTACTED: 7, AWARE: 4, NONE: 1,
  };
  const reasonMap: Record<string, string> = {
    STRONG: "Strong existing donor relationship",
    ACTIVE: "Active relationship with donor",
    CONTACTED: "Prior contact with donor",
    AWARE: "Donor is aware of your work",
    NONE: "No prior donor relationship",
  };
  const score = map[strength] ?? 1;
  return { score, max: 10, reason: reasonMap[strength] || "Relationship unknown" };
}

function scorePartner(required: boolean | null | undefined): ScoreBreakdown["partnerReq"] {
  if (!required) return { score: 8, max: 8, reason: "No partnership required" };
  return { score: 0, max: 8, reason: "Partnership required — partner not yet confirmed" };
}

function scoreLanguage(lang: string | null | undefined): ScoreBreakdown["language"] {
  if (!lang) return { score: 5, max: 5, reason: "No language barrier" };
  const l = lang.toLowerCase();
  if (l.includes("english")) return { score: 5, max: 5, reason: "English application" };
  if (l.includes("arabic") && l.includes("english"))
    return { score: 5, max: 5, reason: "English + Arabic (translation available)" };
  if (l.includes("arabic"))
    return { score: 2, max: 5, reason: "Arabic-only — translation required" };
  return { score: 3, max: 5, reason: "Non-English application may require translation" };
}

function scoreRegistration(req: string | null | undefined): ScoreBreakdown["registration"] {
  if (!req) return { score: 4, max: 4, reason: "No special registration required" };
  const r = req.toLowerCase();
  if (r.includes("standard") || r.includes("ngo") || r.includes("registered"))
    return { score: 3, max: 4, reason: "Standard registration requirement" };
  return { score: 0, max: 4, reason: "Special registration status required — verify eligibility" };
}

export function computeReadinessGaps(
  application: {
    appAttachments: { docType: string }[];
    appNotes: { body: string }[];
    tasks: { title: string; status: string }[];
  },
  opportunity: Pick<Opportunity, "partnerRequired" | "languageRequirement" | "registrationRequirement">
): Array<{ gapType: string; description: string; severity: "HIGH" | "MEDIUM" | "LOW" }> {
  const gaps: Array<{ gapType: string; description: string; severity: "HIGH" | "MEDIUM" | "LOW" }> = [];
  const docTypes = application.appAttachments.map((a) => a.docType);

  if (!docTypes.includes("CONCEPT_NOTE"))
    gaps.push({ gapType: "concept_note", description: "No concept note attached", severity: "HIGH" });

  if (!docTypes.includes("BUDGET"))
    gaps.push({ gapType: "budget", description: "Budget not started or not attached", severity: "MEDIUM" });

  if (!docTypes.includes("INSTITUTIONAL") && !docTypes.includes("REGISTRATION"))
    gaps.push({ gapType: "institutional_docs", description: "No institutional profile or registration documents attached", severity: "MEDIUM" });

  if (opportunity.partnerRequired && !docTypes.includes("OTHER")) {
    const partnerNote = application.appNotes.some((n) => n.body.toLowerCase().includes("partner"));
    if (!partnerNote)
      gaps.push({ gapType: "partner", description: "Partnership required but no partner identified in notes", severity: "HIGH" });
  }

  const lang = opportunity.languageRequirement?.toLowerCase();
  if (lang && lang.includes("arabic") && !docTypes.some((d) => d === "PROPOSAL"))
    gaps.push({ gapType: "translation", description: "Arabic application required — no translated materials attached", severity: "HIGH" });

  if (!docTypes.includes("PROPOSAL"))
    gaps.push({ gapType: "proposal", description: "Full proposal not yet drafted or attached", severity: "HIGH" });

  return gaps;
}
