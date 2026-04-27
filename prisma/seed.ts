import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString: dbUrl });
const db = new PrismaClient({ adapter } as any);

// ─── SpotCast org profile constants (from lib/scoring.ts) ────────────────────
const SPOTCAST_THEMES = [
  "community media", "journalism", "media development", "media freedom",
  "youth", "local development", "civil society", "democracy", "human rights",
  "digital media", "community development", "communication",
  "freedom of expression", "investigative journalism", "media literacy",
];
const SPOTCAST_GEO = ["Lebanon", "MENA", "Arab World", "Middle East", "North Africa"];

// ─── Omar's personal profile (from lib/personal-profile.ts) ──────────────────
const OMAR_KEYWORDS = [
  "podcast", "community radio", "community journalism", "digital storytelling",
  "fact-checking", "misinformation", "disinformation", "media literacy",
  "youth media", "citizen journalism", "investigative journalism",
  "press freedom", "media freedom", "freedom of expression",
  "community engagement", "civic media", "oral history",
  "documentary", "audio journalism", "newsletter", "media sustainability",
  "north lebanon", "akkar", "rural media", "marginalized communities",
  "community hub", "civil society", "advocacy", "human rights",
  "digital skills", "media training", "journalism training", "fellowship",
  "residency", "award", "prize",
];
const OMAR_PRIORITIES = [
  "fact-checking", "podcast", "community hub", "institutional strengthening",
  "digital media", "media literacy", "youth empowerment", "press freedom",
  "community journalism",
];
const OMAR_EXISTING_FUNDERS = [
  "dw akademie", "maharat", "internews", "irc", "rosa luxemburg",
  "skeyes", "samir kassir foundation",
];

async function main() {
  console.log("🌱 Seeding SpotCast Funding Pipeline (PostgreSQL)...\n");

  // ─── WORKSPACE ─────────────────────────────────────────────────────────────
  console.log("Creating SpotCast workspace...");
  const workspace = await db.workspace.upsert({
    where: { slug: "spotcast" },
    update: {},
    create: {
      slug: "spotcast",
      name: "SpotCast",
      type: "ORG",
    },
  });
  console.log(`  ✓ Workspace: ${workspace.name} (${workspace.id})`);

  // ─── USERS ─────────────────────────────────────────────────────────────────
  console.log("\nCreating users...");
  const adminPassword = await bcrypt.hash("spotcast2024!", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@spotcast.org" },
    update: {},
    create: {
      name: "SpotCast Admin",
      email: "admin@spotcast.org",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const fundraisingLead = await db.user.upsert({
    where: { email: "fundraising@spotcast.org" },
    update: {},
    create: {
      name: "Fundraising Lead",
      email: "fundraising@spotcast.org",
      password: await bcrypt.hash("spotcast2024!", 12),
      role: "EDITOR",
    },
  });

  const omar = await db.user.upsert({
    where: { email: "omar@spotcast.org" },
    update: {},
    create: {
      name: "Omar Khaled",
      email: "omar@spotcast.org",
      password: await bcrypt.hash("spotcast2024!", 12),
      role: "ADMIN",
    },
  });

  console.log(`  ✓ Admin: ${admin.email}`);
  console.log(`  ✓ Fundraising Lead: ${fundraisingLead.email}`);
  console.log(`  ✓ Omar: ${omar.email}`);

  // ─── WORKSPACE MEMBERS ─────────────────────────────────────────────────────
  console.log("\nAdding workspace members...");
  for (const { userId, role } of [
    { userId: admin.id, role: "OWNER" as const },
    { userId: omar.id, role: "ADMIN" as const },
    { userId: fundraisingLead.id, role: "MEMBER" as const },
  ]) {
    await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId } },
      update: {},
      create: { workspaceId: workspace.id, userId, role, acceptedAt: new Date() },
    });
  }
  console.log("  ✓ Members linked");

  // ─── ORG PROFILE ───────────────────────────────────────────────────────────
  console.log("\nCreating org profile...");
  await db.orgProfile.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      orgName: "SpotCast",
      orgType: "Community Media / NGO",
      foundedYear: 2019,
      registrationCountry: "Lebanon",
      registrationStatus: "Registered",
      mission:
        "SpotCast is a community media organization based in Akkar, North Lebanon, producing podcast journalism and supporting civic information flows in underserved communities.",
      thematicAreas: JSON.stringify(SPOTCAST_THEMES),
      geography: JSON.stringify(SPOTCAST_GEO),
      fundingRangeMin: 20000,
      fundingRangeMax: 300000,
      preferredLanguages: JSON.stringify(["English", "Arabic"]),
      existingFunders: JSON.stringify([
        "DW Akademie", "Maharat Foundation", "Internews", "Rosa Luxemburg Stiftung",
        "SKEyes", "Samir Kassir Foundation",
      ]),
      website: "https://spotcast.org",
    },
  });
  console.log("  ✓ Org profile created");

  // ─── USER PROFILE (Omar) ───────────────────────────────────────────────────
  console.log("\nCreating Omar's personal profile...");
  await db.userProfile.upsert({
    where: { userId: omar.id },
    update: {},
    create: {
      userId: omar.id,
      workspaceId: workspace.id,
      name: "Omar Khaled",
      location: "Akkar, North Lebanon",
      region: "MENA",
      languages: JSON.stringify(["Arabic", "English"]),
      strategicPriorities: JSON.stringify(OMAR_PRIORITIES),
      thematicInterests: JSON.stringify([
        "community media", "podcast journalism", "digital storytelling",
        "fact-checking", "media literacy", "youth empowerment", "press freedom",
        "community journalism", "investigative journalism", "civic engagement",
        "oral history", "audio journalism", "documentary", "newsletter",
        "media sustainability", "digital skills", "journalism training",
      ]),
      keywords: JSON.stringify(OMAR_KEYWORDS),
      existingFunders: JSON.stringify(OMAR_EXISTING_FUNDERS),
      geography: JSON.stringify(["Lebanon", "MENA", "Arab", "Global", "International"]),
      grantEligibility: JSON.stringify({
        minAmountUSD: 5000,
        maxAmountUSD: 150000,
        orgAgeMaxYears: 5,
        preferNoPartner: true,
      }),
    },
  });
  console.log("  ✓ Omar's profile created");

  // ─── OPPORTUNITY SOURCES ───────────────────────────────────────────────────
  console.log("\nCreating opportunity sources...");
  for (const src of [
    { name: "Daleel Madani", url: "https://daleel-madani.org/civil-society-directory", strategy: "APPLESCRIPT" as const },
    { name: "Earth Journalism Network", url: "https://earthjournalism.net/opportunities", strategy: "APPLESCRIPT" as const },
    { name: "For9a", url: "https://www.for9a.com/en/opportunity", strategy: "HTTP" as const },
  ]) {
    await db.opportunitySource.create({
      data: { workspaceId: workspace.id, ...src },
    }).catch(() => {}); // skip if exists
  }
  console.log("  ✓ Sources created");

  // ─── DONORS ────────────────────────────────────────────────────────────────
  console.log("\nCreating donors...");

  const donors = await Promise.all([
    db.donor.upsert({
      where: { id: "donor-eed" },
      update: {},
      create: {
        id: "donor-eed",
        workspaceId: workspace.id,
        name: "European Endowment for Democracy (EED)",
        type: "MULTILATERAL",
        website: "https://www.eed.eu",
        countryOfOrigin: "Belgium",
        focusAreas: JSON.stringify(["Democracy", "Media Freedom", "Civil Society", "Freedom of Expression"]),
        geographicFocus: JSON.stringify(["MENA", "Lebanon", "Arab World", "Eastern Neighbourhood"]),
        fundingRangeMin: 30000,
        fundingRangeMax: 200000,
        typicalGrantDurationMonths: 18,
        relationshipStrength: "ACTIVE",
        lastInteractionDate: new Date("2024-09-15"),
        preferredFraming:
          "Frame around democratic resilience and independent community voices. EED responds well to local ownership narratives and concrete impact on information ecosystems. Avoid generic 'media development' language — be specific about how SpotCast's work strengthens civic space.",
        notes:
          "Previous grantee relationship. Programme Officer: Anna Weber. Annual calls plus rolling applications possible for existing grantees. Strong interest in Lebanon and North Lebanon specifically.",
        createdById: admin.id,
      },
    }),

    db.donor.upsert({
      where: { id: "donor-rls" },
      update: {},
      create: {
        id: "donor-rls",
        workspaceId: workspace.id,
        name: "Rosa Luxemburg Stiftung (RLS)",
        type: "FOUNDATION",
        website: "https://www.rosalux.org",
        countryOfOrigin: "Germany",
        focusAreas: JSON.stringify(["Social Justice", "Democracy", "Media", "Youth", "Labor Rights", "Civil Society"]),
        geographicFocus: JSON.stringify(["Lebanon", "MENA", "Arab World"]),
        fundingRangeMin: 20000,
        fundingRangeMax: 150000,
        typicalGrantDurationMonths: 12,
        relationshipStrength: "ACTIVE",
        lastInteractionDate: new Date("2024-11-01"),
        preferredFraming:
          "RLS values grassroots organizing and left-progressive framing. Emphasize SpotCast's community roots in Akkar, focus on marginalized/underserved populations, and link media work to social transformation.",
        notes: "Beirut office active. Contact: Beirut regional team. Apply through regional office.",
        createdById: admin.id,
      },
    }),

    db.donor.upsert({
      where: { id: "donor-internews" },
      update: {},
      create: {
        id: "donor-internews",
        workspaceId: workspace.id,
        name: "Internews",
        type: "NGO",
        website: "https://internews.org",
        countryOfOrigin: "United States",
        focusAreas: JSON.stringify(["Media Development", "Journalism Training", "Digital Media", "Media Literacy", "Access to Information", "Investigative Journalism"]),
        geographicFocus: JSON.stringify(["Lebanon", "MENA", "Global"]),
        fundingRangeMin: 50000,
        fundingRangeMax: 500000,
        typicalGrantDurationMonths: 24,
        relationshipStrength: "ACTIVE",
        lastInteractionDate: new Date("2024-10-20"),
        preferredFraming:
          "Frame around measurable media ecosystem impact: journalist safety, audience reach, editorial independence, and digital sustainability. Internews responds to clear theory of change and indicator-based reporting.",
        notes: "Active Lebanon programme. Multiple funding streams including USAID-funded projects. Subgrant opportunities available.",
        createdById: admin.id,
      },
    }),

    db.donor.upsert({
      where: { id: "donor-dwa" },
      update: {},
      create: {
        id: "donor-dwa",
        workspaceId: workspace.id,
        name: "DW Akademie",
        type: "BILATERAL",
        website: "https://www.dw.com/en/dw-akademie",
        countryOfOrigin: "Germany",
        focusAreas: JSON.stringify(["Media Development", "Journalism Training", "Digital Journalism", "Media Management", "Freedom of Expression"]),
        geographicFocus: JSON.stringify(["MENA", "Lebanon", "Global South"]),
        fundingRangeMin: 100000,
        fundingRangeMax: 800000,
        typicalGrantDurationMonths: 36,
        relationshipStrength: "CONTACTED",
        lastInteractionDate: new Date("2024-06-10"),
        preferredFraming:
          "DW Akademie focuses on professional journalism skills, editorial standards, and sustainable media organizations. Lead with SpotCast's training activities, newsroom development, and digital skills.",
        notes: "German BMZ-funded. Long project cycles (3 years). Need to demonstrate organizational capacity.",
        createdById: admin.id,
      },
    }),

    db.donor.upsert({
      where: { id: "donor-ims" },
      update: {},
      create: {
        id: "donor-ims",
        workspaceId: workspace.id,
        name: "International Media Support (IMS)",
        type: "NGO",
        website: "https://www.mediasupport.org",
        countryOfOrigin: "Denmark",
        focusAreas: JSON.stringify(["Media Freedom", "Journalist Safety", "Community Media", "Media in Conflict", "Independent Journalism"]),
        geographicFocus: JSON.stringify(["MENA", "Lebanon", "Conflict-affected contexts"]),
        fundingRangeMin: 25000,
        fundingRangeMax: 200000,
        typicalGrantDurationMonths: 18,
        relationshipStrength: "AWARE",
        lastInteractionDate: new Date("2024-04-15"),
        preferredFraming:
          "IMS prioritizes media in fragile and conflict-affected contexts. Frame SpotCast's work in the context of Lebanon's media crisis, economic collapse, and need for independent local voices.",
        notes: "Danish Danida-funded. Strong MENA programme.",
        createdById: admin.id,
      },
    }),

    db.donor.upsert({
      where: { id: "donor-eu-lb" },
      update: {},
      create: {
        id: "donor-eu-lb",
        workspaceId: workspace.id,
        name: "European Union (EU Delegation Lebanon)",
        type: "MULTILATERAL",
        website: "https://www.eeas.europa.eu/delegations/lebanon",
        countryOfOrigin: "Belgium",
        focusAreas: JSON.stringify(["Civil Society", "Democracy", "Human Rights", "Youth", "Local Development", "Media", "Community Development"]),
        geographicFocus: JSON.stringify(["Lebanon"]),
        fundingRangeMin: 100000,
        fundingRangeMax: 2000000,
        typicalGrantDurationMonths: 36,
        relationshipStrength: "AWARE",
        preferredFraming:
          "EU calls require alignment with EU policy frameworks. Frame work within democratic governance, rule of law, and civil society strengthening.",
        notes: "Infrequent calls but large grants. Often requires consortium with European partners.",
        createdById: admin.id,
      },
    }),

    db.donor.upsert({
      where: { id: "donor-fpu" },
      update: {},
      create: {
        id: "donor-fpu",
        workspaceId: workspace.id,
        name: "Free Press Unlimited (FPU)",
        type: "NGO",
        website: "https://www.freepressunlimited.org",
        countryOfOrigin: "Netherlands",
        focusAreas: JSON.stringify(["Independent Media", "Journalist Safety", "Press Freedom", "Media Viability"]),
        geographicFocus: JSON.stringify(["Global", "MENA", "Lebanon"]),
        fundingRangeMin: 20000,
        fundingRangeMax: 150000,
        typicalGrantDurationMonths: 12,
        relationshipStrength: "NONE",
        preferredFraming:
          "FPU focuses on independent journalism and journalist safety. Emphasize editorial independence, threat environment in Lebanon, and financial sustainability challenges.",
        notes: "Dutch-funded. Runs Press Freedom emergency fund.",
        createdById: admin.id,
      },
    }),
  ]);

  console.log(`  ✓ Created ${donors.length} donors`);

  // ─── DONOR CONTACTS ────────────────────────────────────────────────────────
  console.log("\nAdding donor contacts...");
  await db.donorContact.createMany({
    data: [
      {
        donorId: "donor-eed",
        workspaceId: workspace.id,
        name: "Regional Programme Officer",
        title: "Programme Officer — MENA",
        email: "mena@eed.eu",
        isPrimary: true,
        notes: "Primary contact for Lebanon applications",
      },
      {
        donorId: "donor-rls",
        workspaceId: workspace.id,
        name: "RLS Beirut Office",
        title: "Regional Director — Arab World",
        email: "beirut@rosalux.org",
        isPrimary: true,
        notes: "Applications go through Beirut office directly",
      },
      {
        donorId: "donor-internews",
        workspaceId: workspace.id,
        name: "Lebanon Programme Manager",
        title: "Country Programme Manager",
        email: "lebanon@internews.org",
        isPrimary: true,
      },
    ],
  });
  console.log("  ✓ Contacts added");

  // ─── SAMPLE OPPORTUNITY ────────────────────────────────────────────────────
  console.log("\nCreating sample opportunity...");
  const sampleOpp = await db.opportunity.upsert({
    where: { id: "opp-sample-eed-2025" },
    update: {},
    create: {
      id: "opp-sample-eed-2025",
      workspaceId: workspace.id,
      title: "EED 2025 Call: Independent Media in Lebanon",
      donorId: "donor-eed",
      sourceUrl: "https://www.eed.eu/calls",
      sourceType: "MANUAL",
      deadlineDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      geography: JSON.stringify(["Lebanon", "MENA"]),
      fundingAmountMin: 80000,
      fundingAmountMax: 180000,
      currency: "EUR",
      thematicAreas: JSON.stringify(["Community Media", "Journalism", "Democracy", "Freedom of Expression"]),
      eligibilitySummary:
        "Lebanese civil society organizations with proven track record in independent media, community radio, or civic journalism. Must be legally registered in Lebanon. Min 2 years operational history.",
      summary:
        "EED annual call supporting independent media outlets and community journalism organizations in Lebanon. Focus on editorial independence, civic information, and democratic discourse. Grants up to EUR 180,000 for 18-month projects.",
      applicationType: "OPEN",
      languageRequirement: "English",
      partnerRequired: false,
      status: "NEEDS_REVIEW",
      urgencyLevel: "HIGH",
      dataConfidence: "VERIFIED",
      foundById: fundraisingLead.id,
      foundAt: new Date(),
      createdById: admin.id,
    },
  });
  console.log(`  ✓ Sample opportunity: "${sampleOpp.title}"`);

  // Auto-score it
  const { scoreOpportunity } = await import("../lib/scoring");
  const scored = scoreOpportunity(sampleOpp as Parameters<typeof scoreOpportunity>[0], undefined, "ACTIVE");
  await db.opportunity.update({
    where: { id: sampleOpp.id },
    data: {
      suitabilityScore: scored.score,
      fitLabel: scored.fitLabel,
      scoreBreakdown: JSON.stringify(scored.breakdown),
    },
  });
  await db.scoringResult.create({
    data: {
      workspaceId: workspace.id,
      opportunityId: sampleOpp.id,
      totalScore: scored.score,
      fitLabel: scored.fitLabel,
      breakdown: JSON.stringify(scored.breakdown),
      explanation: scored.explanation,
    },
  });
  console.log(`  ✓ Scored: ${scored.score}/100 — ${scored.fitLabel}`);

  // Add a strategic note
  await db.note.create({
    data: {
      workspaceId: workspace.id,
      opportunityId: sampleOpp.id,
      noteType: "STRATEGIC",
      body:
        "EED has been a strong partner. This call aligns well with SpotCast's work in Akkar. Recommend pursuing immediately — assign to fundraising lead. Key angle: community radio as democratic infrastructure in underserved regions.",
      authorId: admin.id,
      isPinned: true,
    },
  });

  // ─── TAGS ──────────────────────────────────────────────────────────────────
  console.log("\nCreating tags...");
  const tagData = [
    { name: "High Priority", color: "#ef4444" },
    { name: "Community Media", color: "#6366f1" },
    { name: "Journalism", color: "#3b82f6" },
    { name: "Youth", color: "#10b981" },
    { name: "Democracy", color: "#8b5cf6" },
    { name: "Lebanon", color: "#f59e0b" },
    { name: "MENA", color: "#f97316" },
    { name: "Digital Media", color: "#06b6d4" },
    { name: "Partner Required", color: "#ec4899" },
    { name: "Follow Up", color: "#84cc16" },
  ];

  for (const tag of tagData) {
    await db.tag.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: tag.name } },
      update: {},
      create: { workspaceId: workspace.id, ...tag },
    });
  }
  console.log(`  ✓ ${tagData.length} tags created`);

  // ─── RELATIONSHIP LOGS ─────────────────────────────────────────────────────
  console.log("\nCreating relationship logs...");
  await db.relationshipLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        donorId: "donor-eed",
        interactionType: "MEETING",
        date: new Date("2024-09-15"),
        summary:
          "Met with EED Programme Officer at Media Forum Beirut. Discussed SpotCast's expansion in Akkar and interest in upcoming call. They expressed strong interest and encouraged application.",
        loggedById: fundraisingLead.id,
      },
      {
        workspaceId: workspace.id,
        donorId: "donor-rls",
        interactionType: "EMAIL",
        date: new Date("2024-11-01"),
        summary:
          "Sent updated organizational profile and 2024 impact report to RLS Beirut office. Confirmed eligibility for Q1 2025 application window.",
        loggedById: fundraisingLead.id,
      },
      {
        workspaceId: workspace.id,
        donorId: "donor-internews",
        interactionType: "CALL",
        date: new Date("2024-10-20"),
        summary:
          "Introductory call with Internews Lebanon team. Explored potential for subgrant under their USAID-funded programme. Follow-up meeting scheduled for January.",
        loggedById: admin.id,
      },
    ],
  });
  console.log("  ✓ Relationship logs created");

  console.log("\n✅ Seed complete!\n");
  console.log("─────────────────────────────────────────");
  console.log("🔐 Login credentials:");
  console.log("   Admin:            admin@spotcast.org / spotcast2024!");
  console.log("   Omar Khaled:      omar@spotcast.org  / spotcast2024!");
  console.log("   Fundraising Lead: fundraising@spotcast.org / spotcast2024!");
  console.log("─────────────────────────────────────────");
  console.log("🌐 Start the app:  npm run dev");
  console.log("─────────────────────────────────────────\n");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
