"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const expired = params.get("expired") === "1";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);

    // Always report success: telling a stranger whether an address exists is
    // an account-enumeration leak.
    if (error) console.error("[forgot-password]", error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="text-base font-semibold text-gray-900">ईमेल पाठवला · Email sent</h2>
        <p className="mt-2 text-sm text-gray-500">
          If an account exists for <b className="text-gray-700">{email}</b>, a password reset link
          is on its way. The link expires in one hour.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-indigo-600 hover:underline">
          ← लॉगिनवर परत · Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">पासवर्ड विसरलात? · Forgot password</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the admin email and we&apos;ll send a reset link.
        </p>
      </div>

      {expired && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          ती लिंक कालबाह्य झाली आहे · That link has expired or was already used. Request a new one.
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">ईमेल · Email</span>
        <Input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "पाठवत आहे…" : "रीसेट लिंक पाठवा · Send reset link"}
      </Button>

      <Link href="/login" className="text-center text-sm text-indigo-600 hover:underline">
        ← लॉगिनवर परत · Back to login
      </Link>
    </form>
  );
}
