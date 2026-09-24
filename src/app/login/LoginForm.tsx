"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";

export default function LoginForm() {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(t(dict.login.error, lang));
      return;
    }
    router.replace(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex justify-end gap-1 text-xs">
        <button type="button" onClick={() => setLang("mr")}
          className={lang === "mr" ? "font-semibold text-indigo-600" : "text-gray-500"}>मराठी</button>
        <span className="text-gray-300">|</span>
        <button type="button" onClick={() => setLang("en")}
          className={lang === "en" ? "font-semibold text-indigo-600" : "text-gray-500"}>English</button>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">{t(dict.login.email, lang)}</span>
        <Input type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700">{t(dict.login.password, lang)}</span>
        <Input type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>

      <Button type="submit" size="lg" disabled={busy}>
        {busy ? t(dict.common.loading, lang) : t(dict.login.submit, lang)}
      </Button>

      <Link
        href="/forgot-password"
        className="text-center text-sm text-indigo-600 hover:underline"
      >
        पासवर्ड विसरलात? · Forgot password?
      </Link>
    </form>
  );
}
