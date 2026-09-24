"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const MIN_LENGTH = 10;

export default function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      toast.error(`पासवर्ड किमान ${MIN_LENGTH} अक्षरांचा हवा · At least ${MIN_LENGTH} characters`);
      return;
    }
    if (password !== confirm) {
      toast.error("दोन्ही पासवर्ड जुळत नाहीत · Passwords do not match");
      return;
    }

    setBusy(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("पासवर्ड बदलला · Password updated");
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">नवीन पासवर्ड · New password</h2>
        <p className="mt-1 text-sm text-gray-500">{email}</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">नवीन पासवर्ड · New password</span>
        <Input
          type="password"
          required
          minLength={MIN_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="text-xs text-gray-400">किमान {MIN_LENGTH} अक्षरे · minimum {MIN_LENGTH} characters</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">पुन्हा टाका · Confirm password</span>
        <Input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "बदलत आहे…" : "पासवर्ड बदला · Update password"}
      </Button>
    </form>
  );
}
