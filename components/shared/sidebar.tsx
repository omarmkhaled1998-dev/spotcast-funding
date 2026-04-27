"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Search,
  Briefcase,
  Sparkles,
  Settings,
  Radio,
  ShieldCheck,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/opportunities", label: "Opportunities", icon: Search },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/ai", label: "AI Writing", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  function isActive(href: string) {
    if (href === "/settings") {
      return pathname.startsWith("/settings");
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="flex h-screen w-52 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-100">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
          <Radio size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 leading-tight">SpotCast</p>
          <p className="text-xs text-slate-400">Funding Pipeline</p>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              <Icon
                size={16}
                className={active ? "text-indigo-600" : "text-slate-400"}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin link — only super-admins */}
      {isAdmin && (
        <div className="border-t border-slate-100 px-3 py-3">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            )}
          >
            <ShieldCheck
              size={15}
              className={
                pathname.startsWith("/admin") ? "text-indigo-600" : "text-slate-400"
              }
            />
            Admin
          </Link>
        </div>
      )}
    </aside>
  );
}
