"use client";
import { useState } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  label: string;
  date: string;
  type: "opportunity" | "app-donor" | "app-internal" | "task";
  href: string;
  subLabel?: string;
}

const TYPE_STYLES: Record<CalendarEvent["type"], string> = {
  opportunity: "bg-indigo-100 text-indigo-700",
  "app-donor": "bg-red-100 text-red-700",
  "app-internal": "bg-amber-100 text-amber-700",
  task: "bg-emerald-100 text-emerald-700",
};

const TYPE_DOT: Record<CalendarEvent["type"], string> = {
  opportunity: "bg-indigo-500",
  "app-donor": "bg-red-500",
  "app-internal": "bg-amber-500",
  task: "bg-emerald-500",
};

const LEGEND = [
  { type: "opportunity" as const, label: "Opportunity deadline" },
  { type: "app-donor" as const, label: "Application donor deadline" },
  { type: "app-internal" as const, label: "Application internal deadline" },
  { type: "task" as const, label: "Task due" },
];

export function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  function eventsForDay(d: Date) {
    return events.filter((e) => isSameDay(parseISO(e.date), d));
  }

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Calendar</h1>
          <p className="text-xs text-slate-500">Deadlines and task due dates</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <span className="text-sm font-semibold text-slate-800 w-36 text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </button>
          <button
            onClick={() => { setCurrentMonth(new Date()); setSelectedDay(new Date()); }}
            className="ml-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Calendar grid */}
        <div className="flex-1 overflow-auto p-6">
          {/* Legend */}
          <div className="flex gap-4 mb-4 flex-wrap">
            {LEGEND.map(({ type, label }) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${TYPE_DOT[type]}`} />
                <span className="text-xs text-slate-500">{label}</span>
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden border border-slate-200">
            {days.map((d) => {
              const dayEvents = eventsForDay(d);
              const isSelected = selectedDay && isSameDay(d, selectedDay);
              const isCurrentMonth = isSameMonth(d, currentMonth);
              const todayDay = isToday(d);

              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDay(isSameDay(d, selectedDay ?? new Date(0)) ? null : d)}
                  className={`bg-white min-h-[88px] p-1.5 text-left transition-colors hover:bg-slate-50 ${
                    isSelected ? "ring-2 ring-inset ring-indigo-400" : ""
                  }`}
                >
                  <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                    todayDay
                      ? "bg-indigo-600 text-white"
                      : isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-300"
                  }`}>
                    {format(d, "d")}
                  </div>

                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${TYPE_STYLES[ev.type]}`}
                        title={ev.label}
                      >
                        {ev.label}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Side panel for selected day */}
        {selectedDay && (
          <div className="w-72 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-800">{format(selectedDay, "EEEE, MMMM d")}</p>
              <p className="text-xs text-slate-400">{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No events on this day.</p>
              ) : (
                selectedEvents.map((ev) => (
                  <Link key={ev.id} href={ev.href}>
                    <div className="rounded-lg border border-slate-200 p-3 hover:border-indigo-200 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${TYPE_DOT[ev.type]}`} />
                        <Badge className={`text-[10px] ${TYPE_STYLES[ev.type]}`}>
                          {ev.type === "opportunity"
                            ? "Opp Deadline"
                            : ev.type === "app-donor"
                            ? "Donor Deadline"
                            : ev.type === "app-internal"
                            ? "Internal Deadline"
                            : "Task Due"}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-tight">{ev.label}</p>
                      {ev.subLabel && (
                        <p className="text-xs text-slate-400 mt-0.5">{ev.subLabel}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
