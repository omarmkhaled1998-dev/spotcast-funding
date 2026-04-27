"use client";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveAlertSettings, toggleAlert } from "@/lib/actions/alerts";
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertTriangle,
  Mail,
  Clock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AlertLog {
  id: string;
  type: string;
  subject: string;
  sentAt: string;
  opportunityCount: number;
}

interface ExistingAlert {
  id: string;
  isActive: boolean;
  frequency: string;
  minScore: number;
  deadlineAlertDays: number;
  emailAddress: string;
  lastSentAt: string | null;
  logs: AlertLog[];
}

interface Props {
  existingAlert: ExistingAlert | null;
  hasAlertsAddon: boolean;
  userEmail: string;
  justUnsubscribed: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AlertsSettingsClient({
  existingAlert,
  hasAlertsAddon,
  userEmail,
  justUnsubscribed,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isActive, setIsActive] = useState(existingAlert?.isActive ?? true);
  const [frequency, setFrequency] = useState(existingAlert?.frequency ?? "DAILY_DIGEST");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const form = new FormData(e.currentTarget);
    form.set("isActive", isActive.toString());
    form.set("frequency", frequency);

    startTransition(async () => {
      const result = await saveAlertSettings(form);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  async function handleToggle() {
    if (!existingAlert) return;
    const newActive = !isActive;
    setIsActive(newActive);
    startTransition(async () => {
      await toggleAlert(existingAlert.id, newActive);
    });
  }

  return (
    <div className="space-y-6">
      {/* Unsubscribed notice */}
      {justUnsubscribed && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2 text-sm text-green-800">
          <CheckCircle size={15} />
          You&apos;ve been unsubscribed. You can re-enable alerts below.
        </div>
      )}

      {/* Addon gate */}
      {!hasAlertsAddon && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Alerts are an add-on feature</p>
              <p className="text-sm text-amber-700 mt-1">
                Email alerts require the Organization + Alerts Plus plan ($99/month add-on).
                You can still configure your preferences below — they&apos;ll activate when you upgrade.
              </p>
              <a
                href="/settings/billing"
                className="inline-block mt-2 text-sm font-medium text-amber-800 underline"
              >
                Upgrade to Alerts Plus →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      {existingAlert && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            {isActive ? (
              <Bell size={18} className="text-indigo-500" />
            ) : (
              <BellOff size={18} className="text-slate-400" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-800">
                Alerts are {isActive ? "enabled" : "disabled"}
              </p>
              {existingAlert.lastSentAt && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Last sent {new Date(existingAlert.lastSentAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isActive ? "bg-indigo-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}

      {/* Alert config form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Mail size={15} className="text-indigo-500" />
          Alert preferences
        </h2>

        {/* Email */}
        <Input
          label="Send alerts to"
          name="emailAddress"
          type="email"
          required
          defaultValue={existingAlert?.emailAddress ?? userEmail}
          placeholder="you@example.com"
        />

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "IMMEDIATE", label: "Immediate", desc: "Each match" },
              { value: "DAILY_DIGEST", label: "Daily digest", desc: "9 AM UTC" },
              { value: "WEEKLY_DIGEST", label: "Weekly", desc: "Mondays" },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFrequency(value)}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  frequency === value
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <p className={`text-sm font-medium ${frequency === value ? "text-indigo-700" : "text-slate-700"}`}>
                  {label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>
          {frequency === "IMMEDIATE" && !hasAlertsAddon && (
            <p className="text-xs text-amber-600 mt-1.5">
              Immediate alerts require Alerts Plus add-on.
            </p>
          )}
        </div>

        {/* Min score */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Minimum match score
            <span className="ml-1 font-normal text-slate-400">Only notify for opportunities above this score</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              name="minScore"
              min={30}
              max={90}
              step={5}
              defaultValue={existingAlert?.minScore ?? 60}
              className="flex-1 accent-indigo-600"
              id="minScoreRange"
              onInput={(e) => {
                const label = document.getElementById("minScoreLabel");
                if (label) label.textContent = (e.target as HTMLInputElement).value;
              }}
            />
            <span
              id="minScoreLabel"
              className="text-sm font-semibold text-slate-700 w-8 text-right"
            >
              {existingAlert?.minScore ?? 60}
            </span>
          </div>
        </div>

        {/* Deadline days */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Deadline reminder window
            <span className="ml-1 font-normal text-slate-400">Days before deadline to send a reminder</span>
          </label>
          <select
            name="deadlineAlertDays"
            defaultValue={existingAlert?.deadlineAlertDays ?? 14}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value={7}>7 days before deadline</option>
            <option value={14}>14 days before deadline</option>
            <option value={21}>21 days before deadline</option>
            <option value={30}>30 days before deadline</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="flex items-center justify-between pt-2">
          {saved && (
            <p className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle size={14} />
              Alert settings saved
            </p>
          )}
          {!saved && <div />}
          <Button type="submit" isLoading={isPending}>
            {existingAlert ? "Update alerts" : "Enable alerts"}
          </Button>
        </div>
      </form>

      {/* Send history */}
      {existingAlert?.logs && existingAlert.logs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <Clock size={15} className="text-slate-400" />
            Recent sends
          </h2>
          <div className="space-y-2">
            {existingAlert.logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-slate-700">{log.subject}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {log.opportunityCount} {log.opportunityCount === 1 ? "opp" : "opps"}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(log.sentAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
