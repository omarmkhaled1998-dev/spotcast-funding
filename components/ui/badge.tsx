"use client";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "green" | "amber" | "red" | "blue" | "slate";
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: "bg-slate-100 text-slate-700",
  outline: "border border-slate-200 text-slate-600",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-500",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
