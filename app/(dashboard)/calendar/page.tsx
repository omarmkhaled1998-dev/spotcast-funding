import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarClient } from "@/components/calendar/calendar-client";
import { subMonths, addMonths } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();
  const from = subMonths(now, 1);
  const to = addMonths(now, 3);

  const [opportunities, applications, tasks] = await Promise.all([
    db.opportunity.findMany({
      where: {
        deadlineDate: { gte: from, lte: to },
        status: { notIn: ["ARCHIVED", "NO_GO"] },
      },
      select: { id: true, title: true, deadlineDate: true, donor: { select: { name: true } } },
    }),
    db.application.findMany({
      where: {
        stage: { notIn: ["AWARDED", "REJECTED", "NO_RESPONSE", "WITHDRAWN"] },
        OR: [
          { donorDeadline: { gte: from, lte: to } },
          { internalDeadline: { gte: from, lte: to } },
        ],
      },
      include: { opportunity: { select: { title: true } }, donor: { select: { name: true } } },
    }),
    db.task.findMany({
      where: {
        dueDate: { gte: from, lte: to },
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      include: { application: { include: { opportunity: { select: { title: true } } } } },
    }),
  ]);

  type CalEvent = {
    id: string;
    label: string;
    date: string;
    type: "opportunity" | "app-donor" | "app-internal" | "task";
    href: string;
    subLabel?: string;
  };

  type Opp = (typeof opportunities)[number];
  type App = (typeof applications)[number];
  type Task = (typeof tasks)[number];

  const events: CalEvent[] = [
    ...opportunities
      .filter((o: Opp) => o.deadlineDate)
      .map((o: Opp) => ({
        id: `opp-${o.id}`,
        label: o.title,
        date: o.deadlineDate!.toISOString(),
        type: "opportunity" as const,
        href: `/opportunities/${o.id}`,
        subLabel: o.donor?.name,
      })),
    ...applications
      .filter((a: App) => a.donorDeadline)
      .map((a: App) => ({
        id: `app-donor-${a.id}`,
        label: a.opportunity?.title ?? "Application",
        date: a.donorDeadline!.toISOString(),
        type: "app-donor" as const,
        href: `/applications/${a.id}`,
        subLabel: a.donor?.name,
      })),
    ...applications
      .filter((a: App) => a.internalDeadline && a.internalDeadline !== a.donorDeadline)
      .map((a: App) => ({
        id: `app-int-${a.id}`,
        label: a.opportunity?.title ?? "Application",
        date: a.internalDeadline!.toISOString(),
        type: "app-internal" as const,
        href: `/applications/${a.id}`,
        subLabel: "Internal deadline",
      })),
    ...tasks
      .filter((t: Task) => t.dueDate)
      .map((t: Task) => ({
        id: `task-${t.id}`,
        label: t.title,
        date: t.dueDate!.toISOString(),
        type: "task" as const,
        href: `/applications/${t.applicationId}`,
        subLabel: t.application?.opportunity?.title,
      })),
  ];

  return <CalendarClient events={events} />;
}
