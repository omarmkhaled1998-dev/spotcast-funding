import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/shared/sidebar";
import { getWorkspaceContext } from "@/lib/workspace";
import { canAccessDashboard } from "@/lib/subscription";
import { db } from "@/lib/db";
import { Toaster } from "sonner";

// Paths within the dashboard that never require an active subscription
const SUBSCRIPTION_EXEMPT_PREFIXES = [
  "/settings/billing",
  "/settings/profile",
  "/settings/members",
  "/settings/alerts",
  "/settings/ai-usage",
  "/onboarding",
  "/subscription-required",
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? hdrs.get("x-url") ?? "";
  const isExempt = SUBSCRIPTION_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));

  if (!isExempt) {
    const { workspaceId } = await getWorkspaceContext();

    const subscription = await db.subscription.findUnique({
      where: { workspaceId },
    });

    if (!canAccessDashboard(subscription)) {
      redirect("/subscription-required");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
