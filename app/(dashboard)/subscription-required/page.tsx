"use client";
import Link from "next/link";
import { Radio, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionRequiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Lock size={28} className="text-slate-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-800">Subscription required</h1>
        <p className="mt-3 text-slate-500 text-sm leading-relaxed">
          Your trial or subscription has ended. Resubscribe to continue accessing your
          pipeline, opportunities, and donors. Your data is retained for 90 days.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/settings/billing">
            <Button size="lg" className="flex items-center gap-2">
              View billing options
              <ArrowRight size={16} />
            </Button>
          </Link>

          <p className="text-xs text-slate-400">
            Questions?{" "}
            <a href="mailto:support@spotcast.io" className="text-indigo-500 hover:underline">
              Contact support
            </a>
          </p>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
            <Radio size={13} className="text-white" />
          </div>
          SpotCast
        </div>
      </div>
    </div>
  );
}
