import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  UserCircle,
  Users,
  Bell,
  Sparkles,
  CreditCard,
  Globe,
  ArrowRight,
} from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/profile",
    icon: UserCircle,
    label: "Profile",
    description: "Your organization details, thematic focus, and target geography.",
  },
  {
    href: "/settings/sources",
    icon: Globe,
    label: "Opportunity Sources",
    description: "Add custom websites to scrape and configure scraping frequency.",
  },
  {
    href: "/settings/members",
    icon: Users,
    label: "Team Members",
    description: "Invite collaborators and manage their roles and permissions.",
  },
  {
    href: "/settings/alerts",
    icon: Bell,
    label: "Email Alerts",
    description: "Get notified about new high-match opportunities and deadlines.",
  },
  {
    href: "/settings/ai-usage",
    icon: Sparkles,
    label: "AI Usage",
    description: "Track your daily AI request usage and cost breakdown.",
  },
  {
    href: "/settings/billing",
    icon: CreditCard,
    label: "Billing",
    description: "Manage your subscription plan, payment method, and invoices.",
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-8">
        Manage your workspace, sources, team, and account preferences.
      </p>

      <div className="space-y-2">
        {SETTINGS_SECTIONS.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-xl border border-slate-200 px-5 py-4 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors shrink-0">
              <Icon size={17} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                {label}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
            <ArrowRight
              size={15}
              className="text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
