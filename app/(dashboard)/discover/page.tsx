import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DiscoverClient } from "@/components/discover/discover-client";
import { loadCfCookie, cfCookieAgeHours } from "@/lib/scraper/daleel-madani";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [ingestLogs, recentImports] = await Promise.all([
    db.ingestLog.findMany({ orderBy: { startedAt: "desc" }, take: 10 }),
    db.opportunity.findMany({
      where: { sourceType: "SCRAPE" },
      include: { donor: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const cfStore = loadCfCookie();
  const cfAgeHours = cfCookieAgeHours();

  return (
    <DiscoverClient
      ingestLogs={ingestLogs}
      recentImports={recentImports}
      cfCookieExists={!!cfStore}
      cfCookieAgeHours={cfAgeHours}
    />
  );
}
