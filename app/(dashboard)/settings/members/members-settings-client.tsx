"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { inviteMember, removeMember, updateMemberRole } from "@/lib/actions/members";
import {
  UserPlus,
  Mail,
  Shield,
  Eye,
  Users,
  Trash2,
  Clock,
  CheckCircle,
  Crown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: string;
  acceptedAt: string | null;
  invitedAt: string;
}

interface Props {
  members: Member[];
  currentUserId: string;
  canManage: boolean;
  memberLimit: number;
  planType: string;
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER: <Crown size={13} className="text-amber-500" />,
  ADMIN: <Shield size={13} className="text-indigo-500" />,
  MEMBER: <Users size={13} className="text-slate-400" />,
  VIEWER: <Eye size={13} className="text-slate-400" />,
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MembersSettingsClient({
  members,
  currentUserId,
  canManage,
  memberLimit,
  planType,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [roleSelect, setRoleSelect] = useState<Record<string, string>>(
    Object.fromEntries(members.map((m) => [m.id, m.role]))
  );

  const atLimit = members.length >= memberLimit;

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setInviteSuccess("");
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await inviteMember(form);
      if (result?.error) {
        setError(result.error);
      } else {
        setInviteSuccess("Invitation sent!");
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setInviteSuccess(""), 4000);
      }
    });
  }

  function handleRemove(memberId: string, memberEmail: string) {
    if (!confirm(`Remove ${memberEmail} from this workspace?`)) return;
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result?.error) setError(result.error);
    });
  }

  function handleRoleChange(memberId: string, newRole: string) {
    setRoleSelect((prev) => ({ ...prev, [memberId]: newRole }));
    startTransition(async () => {
      const result = await updateMemberRole(memberId, newRole as "ADMIN" | "MEMBER" | "VIEWER");
      if (result?.error) {
        setError(result.error);
        // Revert optimistic update
        const original = members.find((m) => m.id === memberId)?.role ?? "MEMBER";
        setRoleSelect((prev) => ({ ...prev, [memberId]: original }));
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      {canManage && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <UserPlus size={15} className="text-indigo-500" />
            Invite a team member
          </h2>

          {atLimit && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-4">
              Your plan allows up to {memberLimit} member{memberLimit === 1 ? "" : "s"}.{" "}
              <a href="/settings/billing" className="underline font-medium">Upgrade</a> to add more.
            </div>
          )}

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  required
                  placeholder="colleague@organization.org"
                  disabled={atLimit}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  name="role"
                  disabled={atLimit}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEWER">Viewer (read-only)</option>
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}
            {inviteSuccess && (
              <p className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2 flex items-center gap-1.5">
                <CheckCircle size={14} />
                {inviteSuccess}
              </p>
            )}

            <Button type="submit" isLoading={isPending} disabled={atLimit}>
              <Mail size={13} />
              Send invitation
            </Button>
          </form>
        </div>
      )}

      {/* Member list */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">
            Members ({members.length} / {memberLimit})
          </h2>
          <span className="text-xs text-slate-400 capitalize">{planType.replace("_", " ").toLowerCase()} plan</span>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((member) => {
            const isPending_ = !member.acceptedAt;
            const isCurrentUser = member.userId === currentUserId;
            const isOwner = member.role === "OWNER";

            return (
              <div key={member.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-indigo-700">
                      {(member.name ?? member.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {member.name ?? member.email}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">you</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      {isPending_ && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          <Clock size={9} />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {/* Role selector */}
                  {canManage && !isOwner && !isCurrentUser ? (
                    <div className="flex items-center gap-1.5">
                      {ROLE_ICONS[roleSelect[member.id] ?? member.role]}
                      <select
                        value={roleSelect[member.id] ?? member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white text-slate-700 focus:outline-none focus:border-indigo-400"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      {ROLE_ICONS[member.role]}
                      {ROLE_LABELS[member.role]}
                    </div>
                  )}

                  {/* Remove button */}
                  {canManage && !isOwner && !isCurrentUser && (
                    <button
                      type="button"
                      onClick={() => handleRemove(member.id, member.email)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role guide */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Role guide</h3>
        <div className="space-y-2 text-sm">
          {[
            { icon: <Crown size={13} className="text-amber-500" />, role: "Owner", desc: "Full access, billing, can transfer ownership" },
            { icon: <Shield size={13} className="text-indigo-500" />, role: "Admin", desc: "Full access, can invite and remove members" },
            { icon: <Users size={13} className="text-slate-500" />, role: "Member", desc: "Can create, edit, and manage opportunities" },
            { icon: <Eye size={13} className="text-slate-400" />, role: "Viewer", desc: "Read-only access to all workspace data" },
          ].map(({ icon, role, desc }) => (
            <div key={role} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">{icon}</span>
              <span><strong className="text-slate-700">{role}</strong> — <span className="text-slate-500">{desc}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
