"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatDate, formatRelative, daysUntil, formatCurrency,
  FIT_COLORS, STAGE_LABELS, STAGE_COLORS,
} from "@/lib/utils";
import { AlertTriangle, Clock, CheckSquare, Send, Users, Search, Briefcase } from "lucide-react";

interface DashboardProps {
  urgentDeadlines: any[];
  needsReview: any[];
  activeApplications: any[];
  overdueTasks: any[];
  awaitingResponse: any[];
  stats: {
    totalOpportunities: number;
    totalDonors: number;
    totalApplications: number;
    overdueTasks: number;
  };
  recentActivity: any[];
  userName: string;
}

export function DashboardClient({
  urgentDeadlines,
  needsReview,
  activeApplications,
  overdueTasks,
  awaitingResponse,
  stats,
  recentActivity,
  userName,
}: DashboardProps) {
  // Greeting and today's date are time-sensitive — compute client-side only
  // to avoid SSR/hydration mismatch
  const [greeting, setGreeting] = useState("day");
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "morning" : h < 17 ? "afternoon" : "evening");
    setTodayLabel(
      new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    );
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-base font-semibold text-slate-800">
          Good {greeting}, {userName.split(" ")[0]} 👋
        </h1>
        {/* suppressHydrationWarning because todayLabel is computed client-side */}
        <p className="text-xs text-slate-500 mt-0.5" suppressHydrationWarning>
          {todayLabel}
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            label="Active Opportunities"
            value={stats.totalOpportunities}
            icon={<Search size={18} className="text-indigo-500" />}
            href="/opportunities"
          />
          <KPICard
            label="Active Applications"
            value={stats.totalApplications}
            icon={<Briefcase size={18} className="text-blue-500" />}
            href="/applications"
          />
          <KPICard
            label="Donors Tracked"
            value={stats.totalDonors}
            icon={<Users size={18} className="text-purple-500" />}
            href="/donors"
          />
          <KPICard
            label="Overdue Tasks"
            value={stats.overdueTasks}
            icon={<AlertTriangle size={18} className={stats.overdueTasks > 0 ? "text-red-500" : "text-slate-400"} />}
            href="/tasks"
            urgent={stats.overdueTasks > 0}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Urgent Deadlines */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={15} className="text-orange-500" />
                  Deadlines — Next 14 Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                {urgentDeadlines.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3 text-center">No urgent deadlines right now. 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {urgentDeadlines.map((opp) => {
                      const days = daysUntil(opp.deadlineDate);
                      const urgentColor = days !== null && days <= 3
                        ? "border-red-200 bg-red-50"
                        : days !== null && days <= 7
                        ? "border-orange-200 bg-orange-50"
                        : "border-slate-200 bg-white";
                      return (
                        <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                          <div className={`rounded-lg border p-3 flex items-center justify-between hover:border-indigo-200 transition-colors ${urgentColor}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{opp.title}</p>
                              <p className="text-xs text-slate-500">{opp.donor?.name}</p>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              {/* suppressHydrationWarning: daysUntil uses new Date() */}
                              <p suppressHydrationWarning className={`text-sm font-semibold ${days !== null && days <= 3 ? "text-red-600" : days !== null && days <= 7 ? "text-orange-600" : "text-slate-700"}`}>
                                {days === 0 ? "Today" : days !== null && days < 0 ? "Overdue" : `${days}d`}
                              </p>
                              <p className="text-xs text-slate-400">{formatDate(opp.deadlineDate)}</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Needs Review */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle size={15} className="text-amber-500" />
                    Needs Review
                  </span>
                  {needsReview.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">{needsReview.length}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {needsReview.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-2">All caught up ✓</p>
                ) : (
                  <div className="space-y-2">
                    {needsReview.map((opp) => (
                      <Link key={opp.id} href={`/opportunities/${opp.id}`}>
                        <div className="rounded-md p-2.5 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                          <p className="text-sm font-medium text-slate-800 leading-tight line-clamp-1">{opp.title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-slate-400">{opp.donor?.name || "No donor"}</span>
                            {opp.fitLabel && (
                              <Badge className={FIT_COLORS[opp.fitLabel]} variant="outline">
                                {opp.suitabilityScore}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Awaiting Response */}
            {awaitingResponse.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send size={15} className="text-cyan-500" />
                    Awaiting Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {awaitingResponse.map((app) => (
                      <Link key={app.id} href={`/applications/${app.id}`}>
                        <div className="rounded-md p-2 hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-medium text-slate-700 line-clamp-1">{app.opportunity?.title}</p>
                          <p className="text-xs text-slate-400">{app.donor?.name} · submitted {formatDate(app.submissionDate)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Active Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase size={15} className="text-indigo-500" />
                Active Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeApplications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-3">No active applications.</p>
              ) : (
                <div className="space-y-2">
                  {activeApplications.slice(0, 6).map((app) => (
                    <Link key={app.id} href={`/applications/${app.id}`}>
                      <div className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800 font-medium truncate">{app.opportunity?.title}</p>
                          <p className="text-xs text-slate-400">{app.donor?.name}</p>
                        </div>
                        <Badge className={STAGE_COLORS[app.stage] + " ml-2 shrink-0"}>
                          {STAGE_LABELS[app.stage]}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                  {activeApplications.length > 6 && (
                    <Link href="/applications" className="block text-xs text-indigo-600 text-center pt-1 hover:underline">
                      +{activeApplications.length - 6} more →
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={15} className={overdueTasks.length > 0 ? "text-red-500" : "text-slate-400"} />
                Overdue Tasks
                {overdueTasks.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 ml-auto">
                    {overdueTasks.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-3">No overdue tasks. Keep it up!</p>
              ) : (
                <div className="space-y-2">
                  {overdueTasks.map((task) => {
                    const days = daysUntil(task.dueDate);
                    return (
                      <Link key={task.id} href={`/applications/${task.applicationId}`}>
                        <div className="flex items-start gap-2 p-2 rounded-md hover:bg-red-50 transition-colors">
                          <AlertTriangle size={13} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 font-medium leading-tight">{task.title}</p>
                            <p className="text-xs text-slate-400 truncate">{task.application?.opportunity?.title}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {/* suppressHydrationWarning: daysUntil uses new Date() */}
                            <p className="text-xs text-red-600 font-medium" suppressHydrationWarning>
                              {days} days
                            </p>
                            {task.assignee && <p className="text-xs text-slate-400">{task.assignee.name}</p>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-semibold shrink-0">
                    {log.user?.name?.[0] || "S"}
                  </div>
                  <div className="flex-1 text-sm text-slate-700">
                    <span className="font-medium">{log.user?.name || "System"}</span>{" "}
                    {log.action.replace(/_/g, " ")}{" "}
                    {log.opportunity && (
                      <Link href={`/opportunities/${log.opportunityId}`} className="text-indigo-600 hover:underline">
                        {log.opportunity.title}
                      </Link>
                    )}
                    {log.application?.opportunity && (
                      <Link href={`/applications/${log.applicationId}`} className="text-indigo-600 hover:underline">
                        {log.application.opportunity.title}
                      </Link>
                    )}
                  </div>
                  {/* suppressHydrationWarning: formatRelative uses new Date() */}
                  <span className="text-xs text-slate-400 shrink-0" suppressHydrationWarning>
                    {formatRelative(log.createdAt)}
                  </span>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No activity yet. Start by adding an opportunity.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({
  label, value, icon, href, urgent,
}: { label: string; value: number; icon: React.ReactNode; href: string; urgent?: boolean }) {
  return (
    <Link href={href}>
      <div className={`rounded-xl border bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all ${urgent ? "border-red-200" : "border-slate-200"}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
          {icon}
        </div>
        <p className={`text-3xl font-bold ${urgent ? "text-red-600" : "text-slate-800"}`}>{value}</p>
      </div>
    </Link>
  );
}
