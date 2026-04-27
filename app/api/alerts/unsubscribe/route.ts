/**
 * One-click unsubscribe endpoint.
 * Linked from every alert email footer.
 *
 * GET /api/alerts/unsubscribe?id=<alertId>
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const alertId = req.nextUrl.searchParams.get("id");
  if (!alertId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.emailAlert.updateMany({
    where: { id: alertId },
    data: { isActive: false },
  });

  // Redirect to a confirmation page
  return NextResponse.redirect(
    new URL("/settings/alerts?unsubscribed=1", req.url)
  );
}
