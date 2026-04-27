"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Radio, Mail, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/actions/auth-reset";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await requestPasswordReset(form);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 mb-4">
            <Radio size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Reset your password</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <Mail size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Check your inbox</p>
                <p className="text-sm text-slate-500 mt-1">
                  If an account exists for that email, we sent a reset link. Check
                  your spam folder if you don&apos;t see it.
                </p>
              </div>
              <Link
                href="/login"
                className="block text-sm text-indigo-600 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email address"
                name="email"
                type="email"
                required
                placeholder="you@organization.org"
                autoComplete="email"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" isLoading={isPending}>
                {isPending ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm text-slate-500 mt-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
            >
              <ArrowLeft size={13} /> Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
