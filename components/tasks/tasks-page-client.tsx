"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { formatDate, daysUntil, PRIORITY_COLORS } from "@/lib/utils";
import { AlertTriangle, Check } from "lucide-react";
import type { TaskStatus } from "@/app/generated/prisma/client";

export function TasksPageClient({ tasks, currentUserId }: { tasks: any[]; currentUserId: string }) {
  const [filter, setFilter] = useState<"all" | "mine" | "overdue">("all");
  const [, startTransition] = useTransition();

  const filtered = tasks.filter((t) => {
    if (filter === "mine") return t.assigneeId === currentUserId;
    if (filter === "overdue") {
      const d = daysUntil(t.dueDate);
      return d !== null && d < 0;
    }
    return true;
  });

  const overdue = tasks.filter((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0;
  }).length;

  function handleToggle(task: any) {
    const next: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    startTransition(async () => { await updateTaskStatus(task.id, next); });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Tasks</h1>
          <p className="text-xs text-slate-500">{tasks.length} open · {overdue} overdue</p>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-100 bg-white">
        {(["all", "mine", "overdue"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? "All tasks" : f === "mine" ? "My tasks" : `Overdue (${overdue})`}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">No tasks to show.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const days = daysUntil(task.dueDate);
              const overdue = days !== null && days < 0;
              return (
                <div
                  key={task.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 flex items-start gap-3 hover:border-indigo-200 transition-colors"
                >
                  <button
                    onClick={() => handleToggle(task)}
                    className="mt-0.5 h-4 w-4 rounded border-2 border-slate-300 hover:border-indigo-400 flex items-center justify-center shrink-0"
                  >
                    {task.status === "DONE" && <Check size={10} className="text-green-500" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <Link
                        href={`/applications/${task.applicationId}`}
                        className="text-xs text-indigo-600 hover:underline truncate max-w-xs"
                      >
                        {task.application?.opportunity?.title}
                      </Link>
                      <span className="text-xs text-slate-400">{task.application?.donor?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    {task.assignee && (
                      <span className="text-xs text-slate-500">{task.assignee.name}</span>
                    )}
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-0.5 ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                        {overdue && <AlertTriangle size={10} />}
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    TODO: "bg-slate-100 text-slate-600",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    BLOCKED: "bg-red-100 text-red-600",
    CANCELLED: "bg-slate-100 text-slate-400",
  };
  return (
    <Badge className={map[status] || "bg-slate-100 text-slate-600"}>
      {status.replace("_", " ")}
    </Badge>
  );
}
