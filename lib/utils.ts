import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  return differenceInDays(new Date(date), new Date());
}

export function urgencyFromDays(days: number | null): "critical" | "high" | "medium" | "low" {
  if (days === null) return "low";
  if (days <= 3) return "critical";
  if (days <= 7) return "high";
  if (days <= 14) return "medium";
  return "low";
}

export function formatCurrency(amount: number | null | undefined, currency = "USD"): string {
  if (!amount) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toJsonArray(values: string[]): string {
  return JSON.stringify(values);
}

export const STAGE_LABELS: Record<string, string> = {
  PREPARATION: "Preparation",
  CONCEPT_NOTE: "Concept Note",
  PROPOSAL: "Proposal",
  INTERNAL_REVIEW: "Internal Review",
  SUBMITTED: "Submitted",
  AWARDED: "Awarded",
  REJECTED: "Rejected",
  NO_RESPONSE: "No Response",
  WITHDRAWN: "Withdrawn",
};

export const STAGE_COLORS: Record<string, string> = {
  PREPARATION: "bg-slate-100 text-slate-700",
  CONCEPT_NOTE: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-indigo-100 text-indigo-700",
  INTERNAL_REVIEW: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-cyan-100 text-cyan-700",
  AWARDED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  NO_RESPONSE: "bg-gray-100 text-gray-600",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export const FIT_COLORS: Record<string, string> = {
  SUITABLE: "bg-green-100 text-green-700 border-green-200",
  MAYBE: "bg-amber-100 text-amber-700 border-amber-200",
  NOT_SUITABLE: "bg-red-100 text-red-600 border-red-200",
};

/** Human-readable fit labels replacing raw enum values in the UI */
export const FIT_LABELS: Record<string, string> = {
  SUITABLE: "Strong match",
  MAYBE: "Worth reviewing",
  NOT_SUITABLE: "Not a fit",
};

/** Human-readable status labels replacing raw enum values in the UI */
export const STATUS_LABELS: Record<string, string> = {
  NEEDS_REVIEW: "New",
  UNDER_EVALUATION: "Reviewing",
  GO: "Pursuing",
  HOLD: "On hold",
  NO_GO: "Declined",
  ARCHIVED: "Archived",
};

export const URGENCY_COLORS: Record<string, string> = {
  critical: "text-red-600 bg-red-50 border-red-200",
  high: "text-orange-600 bg-orange-50 border-orange-200",
  medium: "text-amber-600 bg-amber-50 border-amber-200",
  low: "text-slate-500 bg-slate-50 border-slate-200",
};

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-600",
  HIGH: "text-orange-500",
  MEDIUM: "text-amber-500",
  LOW: "text-slate-400",
};
