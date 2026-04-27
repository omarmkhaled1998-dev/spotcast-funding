"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { createTask, updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { formatDate, daysUntil, PRIORITY_COLORS } from "@/lib/utils";
import { Plus, Trash2, AlertTriangle, Check } from "lucide-react";
import type { TaskStatus } from "@/app/generated/prisma/client";

const STATUS_STYLES: Record<string, string> = {
  TODO: "border-slate-300",
  IN_PROGRESS: "border-blue-400 bg-blue-50",
  DONE: "border-green-400 bg-green-50 opacity-60",
  BLOCKED: "border-red-400 bg-red-50",
  CANCELLED: "border-slate-200 opacity-40",
};

export function TasksPanel({
  applicationId,
  tasks,
  users,
}: {
  applicationId: string;
  tasks: any[];
  users: { id: string; name: string }[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "open">("open");
  const [, startTransition] = useTransition();

  const filtered = tasks.filter((t) => {
    if (filter === "open") return t.status !== "DONE" && t.status !== "CANCELLED";
    return true;
  });

  function handleStatusToggle(task: any) {
    const next: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    startTransition(async () => { await updateTaskStatus(task.id, next); });
  }

  function handleDelete(taskId: string) {
    if (!confirm("Delete this task?")) return;
    startTransition(async () => { await deleteTask(taskId); });
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await createTask(applicationId, data);
      setShowForm(false);
    });
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["open", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                filter === f ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f === "open" ? "Open tasks" : "All tasks"}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={13} /> Add Task
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <p className="text-sm">No tasks yet.</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowForm(true)}>
            Add the first task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const days = daysUntil(task.dueDate);
            const overdue = days !== null && days < 0 && task.status !== "DONE";
            return (
              <div
                key={task.id}
                className={`rounded-lg border-l-4 border border-r-slate-200 border-t-slate-200 border-b-slate-200 p-3 bg-white flex items-start gap-3 ${STATUS_STYLES[task.status]}`}
              >
                <button
                  onClick={() => handleStatusToggle(task)}
                  className={`mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    task.status === "DONE"
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-slate-300 hover:border-indigo-400"
                  }`}
                >
                  {task.status === "DONE" && <Check size={10} />}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {task.assignee && (
                      <span className="text-xs text-slate-500">{task.assignee.name}</span>
                    )}
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-0.5 ${overdue ? "text-red-600 font-medium" : "text-slate-400"}`}>
                        {overdue && <AlertTriangle size={10} />}
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.status !== "TODO" && task.status !== "DONE" && (
                      <span className="text-xs text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                        {task.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 shrink-0">
                  <Select
                    options={[
                      { value: "TODO", label: "To Do" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "DONE", label: "Done" },
                      { value: "BLOCKED", label: "Blocked" },
                      { value: "CANCELLED", label: "Cancelled" },
                    ]}
                    value={task.status}
                    onChange={(e) => startTransition(async () => { await updateTaskStatus(task.id, e.target.value as TaskStatus); })}
                    className="text-xs w-32 py-1"
                  />
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Task">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Task" name="title" required placeholder="Draft concept note..." />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assign to"
              name="assigneeId"
              placeholder="Select person..."
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
            <Input label="Due Date" name="dueDate" type="date" />
          </div>
          <Select
            label="Priority"
            name="priority"
            options={[
              { value: "CRITICAL", label: "Critical" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
            defaultValue="MEDIUM"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
