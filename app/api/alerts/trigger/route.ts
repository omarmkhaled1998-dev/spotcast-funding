/**
 * Alert trigger endpoint.
 *
 * Called daily by Railway's cron scheduler (or any external cron service):
 *   POST /api/alerts/trigger
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Dispatches:
 *   1. Daily / weekly digest alerts (new high-score opportunities)
 *   2. Deadline reminder alerts
 */
import { NextRequest, NextResponse } from "next/server";
import { dispatchDailyAlerts, dispatchDeadlineReminders } from "@/lib/email/alert-sender";

export async function POST(req: NextRequest) {
  // Validate cron secret
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [digestResult, deadlineCount] = await Promise.all([
      dispatchDailyAlerts(),
      dispatchDeadlineReminders(),
    ]);

    return NextResponse.json({
      ok: true,
      digest: digestResult,
      deadlineRemindersSent: deadlineCount,
    });
  } catch (err) {
    console.error("[alerts/trigger] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
