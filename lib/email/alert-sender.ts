/**
 * Email alert sending logic.
 *
 * Three trigger types:
 *   - NEW_OPPORTUNITIES  : new opps with score >= alert.minScore
 *   - DEADLINE_REMINDER  : opps with deadline <= alert.deadlineAlertDays days away
 *   - HIGH_MATCH         : immediate alert for individual high-score opp (IMMEDIATE frequency)
 *
 * Called from:
 *   - /api/alerts/trigger (cron endpoint, runs daily at 9 AM UTC)
 *   - ingest-processor (for IMMEDIATE frequency alerts)
 */
import { db } from "@/lib/db";
import { sendEmail } from "./transactional";
import type { Opportunity } from "@/app/generated/prisma/client";

const APP_URL = process.env.NEXTAUTH_URL ?? "https://app.spotcast.io";
const FROM_NAME = "SpotCast Alerts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OppForAlert {
  id: string;
  title: string;
  donorName?: string;
  suitabilityScore?: number | null;
  fitLabel?: string | null;
  deadlineDate?: Date | null;
  geography?: string;
  thematicAreas?: string;
  summary?: string | null;
}

// ── Main dispatch ─────────────────────────────────────────────────────────────

/**
 * Run the daily alert dispatch for all active alerts.
 * Call once per day (e.g. from a cron API route at 9 AM UTC).
 */
export async function dispatchDailyAlerts(): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const alerts = await db.emailAlert.findMany({
    where: {
      isActive: true,
      frequency: { in: ["DAILY_DIGEST", "WEEKLY_DIGEST"] },
    },
    include: { workspace: { select: { id: true } } },
  });

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const alert of alerts) {
    try {
      // Weekly: only send on Mondays (day 1)
      if (alert.frequency === "WEEKLY_DIGEST" && new Date().getUTCDay() !== 1) {
        skipped++;
        continue;
      }

      // Find recent high-scoring opportunities
      const since = alert.lastSentAt ?? new Date(Date.now() - 7 * 86_400_000);
      const opps = await db.opportunity.findMany({
        where: {
          workspaceId: alert.workspace.id,
          suitabilityScore: { gte: alert.minScore },
          createdAt: { gte: since },
          status: { notIn: ["NO_GO", "ARCHIVED"] },
        },
        include: { donor: { select: { name: true } } },
        orderBy: { suitabilityScore: "desc" },
        take: 5,
      });

      if (opps.length === 0) {
        skipped++;
        continue;
      }

      const subject =
        alert.frequency === "WEEKLY_DIGEST"
          ? `SpotCast Weekly Digest — ${opps.length} new opportunities`
          : `SpotCast: ${opps.length} new high-match opportunities`;

      await sendAlertEmail({
        to: alert.emailAddress,
        subject,
        alertType: "NEW_OPPORTUNITIES",
        opportunities: opps.map((o) => ({
          id: o.id,
          title: o.title,
          donorName: o.donor?.name,
          suitabilityScore: o.suitabilityScore,
          fitLabel: o.fitLabel,
          deadlineDate: o.deadlineDate,
          summary: o.summary,
        })),
        unsubscribeAlertId: alert.id,
      });

      // Log the send
      await db.emailAlertLog.create({
        data: {
          alertId: alert.id,
          type: "NEW_OPPORTUNITIES",
          subject,
          sentAt: new Date(),
          recipientEmail: alert.emailAddress,
          opportunityCount: opps.length,
        },
      });

      // Update lastSentAt
      await db.emailAlert.update({
        where: { id: alert.id },
        data: { lastSentAt: new Date() },
      });

      sent++;
    } catch (err) {
      errors.push(`Alert ${alert.id}: ${String(err)}`);
    }
  }

  return { sent, skipped, errors };
}

/**
 * Send deadline reminder alerts.
 * Finds applications in-progress where deadline is within N days.
 */
export async function dispatchDeadlineReminders(): Promise<number> {
  const alerts = await db.emailAlert.findMany({
    where: { isActive: true },
    include: { workspace: { select: { id: true } } },
  });

  let sent = 0;

  for (const alert of alerts) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + alert.deadlineAlertDays);

    const opps = await db.opportunity.findMany({
      where: {
        workspaceId: alert.workspace.id,
        deadlineDate: { gte: new Date(), lte: cutoff },
        application: { isNot: null }, // has an active application
        status: { notIn: ["NO_GO", "ARCHIVED"] },
      },
      include: { donor: { select: { name: true } } },
      orderBy: { deadlineDate: "asc" },
      take: 5,
    });

    if (opps.length === 0) continue;

    const subject = `Deadline reminder: ${opps.length} application${opps.length > 1 ? "s" : ""} due soon`;

    try {
      await sendAlertEmail({
        to: alert.emailAddress,
        subject,
        alertType: "DEADLINE_REMINDER",
        opportunities: opps.map((o) => ({
          id: o.id,
          title: o.title,
          donorName: o.donor?.name,
          deadlineDate: o.deadlineDate,
          suitabilityScore: o.suitabilityScore,
          fitLabel: o.fitLabel,
          summary: o.summary,
        })),
        unsubscribeAlertId: alert.id,
      });

      await db.emailAlertLog.create({
        data: {
          alertId: alert.id,
          type: "DEADLINE_REMINDER",
          subject,
          sentAt: new Date(),
          recipientEmail: alert.emailAddress,
          opportunityCount: opps.length,
        },
      });

      sent++;
    } catch {
      // continue
    }
  }

  return sent;
}

/**
 * Send an immediate alert when a single high-score opportunity is ingested.
 * Only triggers for alerts with frequency = IMMEDIATE.
 */
export async function sendImmediateAlert(
  opp: Pick<Opportunity, "id" | "title" | "suitabilityScore" | "fitLabel" | "deadlineDate" | "summary" | "workspaceId">
): Promise<void> {
  if (!opp.suitabilityScore) return;

  const alerts = await db.emailAlert.findMany({
    where: {
      isActive: true,
      frequency: "IMMEDIATE",
      minScore: { lte: opp.suitabilityScore },
      workspace: { id: opp.workspaceId },
    },
  });

  for (const alert of alerts) {
    try {
      const subject = `High-match opportunity: ${opp.title}`;
      await sendAlertEmail({
        to: alert.emailAddress,
        subject,
        alertType: "HIGH_MATCH",
        opportunities: [
          {
            id: opp.id,
            title: opp.title,
            suitabilityScore: opp.suitabilityScore,
            fitLabel: opp.fitLabel,
            deadlineDate: opp.deadlineDate,
            summary: opp.summary,
          },
        ],
        unsubscribeAlertId: alert.id,
      });

      await db.emailAlertLog.create({
        data: {
          alertId: alert.id,
          type: "HIGH_MATCH",
          subject,
          sentAt: new Date(),
          recipientEmail: alert.emailAddress,
          opportunityCount: 1,
        },
      });

      await db.emailAlert.update({
        where: { id: alert.id },
        data: { lastSentAt: new Date() },
      });
    } catch {
      // Non-fatal — don't interrupt ingest
    }
  }
}

// ── Email template ─────────────────────────────────────────────────────────────

async function sendAlertEmail({
  to,
  subject,
  alertType,
  opportunities,
  unsubscribeAlertId,
}: {
  to: string;
  subject: string;
  alertType: "NEW_OPPORTUNITIES" | "DEADLINE_REMINDER" | "HIGH_MATCH";
  opportunities: OppForAlert[];
  unsubscribeAlertId: string;
}) {
  const unsubscribeUrl = `${APP_URL}/api/alerts/unsubscribe?id=${unsubscribeAlertId}`;

  const oppRows = opportunities
    .map((o) => {
      const deadline = o.deadlineDate
        ? `<span style="color:#ef4444;font-size:12px;">⏱ ${formatAlertDate(o.deadlineDate)}</span>`
        : "";
      const score =
        o.suitabilityScore != null
          ? `<span style="background:#e0e7ff;color:#3730a3;font-size:11px;padding:2px 8px;border-radius:9999px;font-weight:600;">${o.suitabilityScore}/100</span>`
          : "";
      const fitBadge = o.fitLabel
        ? `<span style="font-size:11px;color:${fitColor(o.fitLabel)};">${o.fitLabel.replace("_", " ")}</span>`
        : "";

      return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:12px;background:white;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
            <a href="${APP_URL}/opportunities/${o.id}"
               style="font-weight:600;font-size:14px;color:#0f172a;text-decoration:none;">
              ${escHtml(o.title)}
            </a>
            <div style="display:flex;align-items:center;gap:6px;white-space:nowrap;">${score} ${fitBadge}</div>
          </div>
          ${o.donorName ? `<p style="margin:0 0 4px;font-size:12px;color:#6366f1;">${escHtml(o.donorName)}</p>` : ""}
          ${deadline ? `<p style="margin:0 0 6px;">${deadline}</p>` : ""}
          ${o.summary ? `<p style="margin:0;font-size:13px;color:#475569;line-height:1.5;">${escHtml(o.summary.substring(0, 180))}…</p>` : ""}
          <a href="${APP_URL}/opportunities/${o.id}"
             style="display:inline-block;margin-top:10px;font-size:12px;color:#4f46e5;font-weight:600;text-decoration:none;">
            View opportunity →
          </a>
        </div>`;
    })
    .join("");

  const alertTypeLabel =
    alertType === "DEADLINE_REMINDER"
      ? "Deadline reminder — applications due soon"
      : alertType === "HIGH_MATCH"
      ? "New high-match opportunity"
      : "New high-match opportunities";

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px 16px;">
  <div style="max-width:540px;margin:0 auto;">
    <!-- Header -->
    <div style="background:#4f46e5;border-radius:12px 12px 0 0;padding:20px 28px;display:flex;align-items:center;gap:10px;">
      <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:6px 10px;">
        <span style="color:white;font-weight:800;font-size:15px;">SpotCast</span>
      </div>
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;">${alertTypeLabel}</p>
    </div>

    <!-- Body -->
    <div style="background:white;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 28px;">
      <p style="margin:0 0 16px;font-size:14px;color:#475569;">
        We found <strong>${opportunities.length}</strong> ${opportunities.length === 1 ? "opportunity" : "opportunities"} matching your alert settings.
      </p>

      ${oppRows}

      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9;">
        <a href="${APP_URL}/opportunities"
           style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;font-weight:600;font-size:13px;padding:10px 20px;border-radius:8px;">
          View all opportunities →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;line-height:1.6;">
      You're receiving this because you have alerts enabled in SpotCast.<br>
      <a href="${unsubscribeUrl}" style="color:#94a3b8;">Unsubscribe from alerts</a>
      &nbsp;·&nbsp;
      <a href="${APP_URL}/settings/alerts" style="color:#94a3b8;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;

  await sendEmail({ to, subject, html });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fitColor(label: string): string {
  return label === "SUITABLE" ? "#15803d" : label === "MAYBE" ? "#b45309" : "#dc2626";
}

function formatAlertDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
