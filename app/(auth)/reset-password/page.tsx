"use client";
import { Suspense, useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Radio, CheckCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword, validateResetToken } from "@/lib/actions/auth-reset";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  // Validate token on mount
  useEffect(() => {
    if (!token || !email) {
      setTokenValid(false);
      return;
    }
    validateResetToken(token, email).then(setTokenValid);
  }, [token, email]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    form.set("token", token);
    form.set("email", email);

    startTransition(async () => {
      const result = await resetPassword(form);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
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
          <h1 className="text-xl font-bold text-slate-800">Choose a new password</h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Loading state */}
          {tokenValid === null && (
            <div className="flex justify-center py-4">
              <span className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
            </div>
          )}

          {/* Invalid / expired token */}
          {tokenValid === false && (
            <div className="text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Link expired or invalid</p>
                <p className="text-sm text-slate-500 mt-1">
                  This password reset link has expired or already been used.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="inline-block text-sm text-indigo-600 hover:underline"
              >
                Request a new reset link
              </Link>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Password updated!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Redirecting you to sign in…
                </p>
              </div>
            </div>
          )}

          {/* Reset form */}
          {tokenValid === true && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
                name="password"
                type="password"
                required
                placeholder="At least 8 characters"
                autoComplete="new-password"
                hint="Min. 8 characters"
              />
              <Input
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                required
                placeholder="Repeat your new password"
                autoComplete="new-password"
              />

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" isLoading={isPending} size="lg">
                {isPending ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
