"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { createUser, toggleUserActive, changeUserRole } from "@/lib/actions/admin";
import { Plus, Shield, UserCheck, UserX } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-indigo-100 text-indigo-700",
  EDITOR: "bg-blue-100 text-blue-700",
  VIEWER: "bg-slate-100 text-slate-600",
};

export function AdminClient({
  users,
  currentUserId,
}: {
  users: { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date }[];
  currentUserId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      await createUser(data);
      setShowForm(false);
    });
  }

  function handleToggleActive(userId: string, current: boolean) {
    if (userId === currentUserId) return;
    startTransition(async () => { await toggleUserActive(userId, !current); });
  }

  function handleRoleChange(userId: string, role: string) {
    if (userId === currentUserId) return;
    startTransition(async () => { await changeUserRole(userId, role as "ADMIN" | "EDITOR" | "VIEWER"); });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div>
          <h1 className="text-base font-semibold text-slate-800">Admin — Users</h1>
          <p className="text-xs text-slate-500">{users.length} team members</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} /> Invite User
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden max-w-3xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Name</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Email</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Role</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Joined</th>
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className={`${!user.isActive ? "opacity-50" : ""}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                        {user.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="text-[10px]">You</Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{user.email}</td>
                  <td className="py-3 px-4">
                    {user.id === currentUserId ? (
                      <Badge className={ROLE_COLORS[user.role]}>{user.role}</Badge>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={`text-xs border-0 rounded-full px-2.5 py-1 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 ${ROLE_COLORS[user.role]}`}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {user.isActive ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <UserCheck size={13} /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <UserX size={13} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="py-3 px-4 text-right">
                    {user.id !== currentUserId && (
                      <button
                        onClick={() => handleToggleActive(user.id, user.isActive)}
                        className={`text-xs font-medium hover:underline ${user.isActive ? "text-red-500" : "text-green-600"}`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 max-w-3xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <Shield size={15} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Role permissions</p>
              <p><span className="font-medium">Admin</span> — full access including user management and settings</p>
              <p><span className="font-medium">Editor</span> — create, edit, and manage all pipeline content</p>
              <p><span className="font-medium">Viewer</span> — read-only access across all modules</p>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Invite Team Member">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name" name="name" required placeholder="Sarah Khalil" />
          <Input label="Email" name="email" type="email" required placeholder="sarah@spotcast.org" />
          <Input label="Temporary Password" name="password" type="password" required placeholder="Min 8 characters" />
          <Select
            label="Role"
            name="role"
            options={[
              { value: "EDITOR", label: "Editor — can create and edit" },
              { value: "VIEWER", label: "Viewer — read only" },
              { value: "ADMIN", label: "Admin — full access" },
            ]}
            defaultValue="EDITOR"
          />
          <p className="text-xs text-slate-500">
            The user will receive login credentials and can change their password on first login.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
