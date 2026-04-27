"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Radio, Building2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signup } from "@/lib/actions/auth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [wsType, setWsType] = useState<"ORG" | "INDIVIDUAL">("ORG");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    form.set("workspaceType", wsType);

    startTransition(async () => {
      const result = await signup(form);
      if (result?.error) {
        setError(result.error);
      }
      // On success, signup() calls redirect() server-side — navigation handled automatically
    });
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    // Google OAuth creates workspace as INDIVIDUAL by default (user can change in onboarding)
    await signIn("google", { callbackUrl: "/onboarding" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4">
            <Radio size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">
            Start your 14-day free trial — no credit card required
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || isPending}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-5"
          >
            {googleLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">or sign up with email</span>
            </div>
          </div>

          {/* Workspace type picker */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">I am a…</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "ORG", label: "Organization / NGO", icon: Building2 },
                { value: "INDIVIDUAL", label: "Individual / Freelancer", icon: User },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWsType(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center text-xs font-medium transition-colors ${
                    wsType === value
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Your name"
              name="name"
              type="text"
              required
              placeholder="Your full name"
              autoComplete="name"
            />
            <Input
              label={wsType === "ORG" ? "Organization name" : "Workspace name"}
              name="workspaceName"
              type="text"
              required
              placeholder={wsType === "ORG" ? "SpotCast Media" : "My Funding Tracker"}
            />
            <Input
              label="Work email"
              name="email"
              type="email"
              required
              placeholder="you@organization.org"
              autoComplete="email"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              placeholder="At least 8 characters"
              autoComplete="new-password"
              hint="Min. 8 characters"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={isPending} size="lg">
              {isPending ? "Creating account…" : "Start free trial"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-4">
            14-day free trial · No credit card required · Cancel anytime
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
