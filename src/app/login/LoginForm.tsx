"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useLang } from "@/lib/i18n/LangContext";
import { dict, t } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils";

export default function LoginForm() {
  const { lang, setLang } = useLang();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      toast.error(t(dict.login.error, lang));
      return;
    }
    // Keep the button in loading state through the redirect — feels much
    // less jumpy than flashing back to "Login" for a frame first.
    router.replace(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={() => setLang("mr")}
          className={cn("rounded px-1.5 py-0.5 transition-colors",
            lang === "mr" ? "font-semibold text-indigo-600" : "text-gray-500 hover:text-gray-800")}
        >
          मराठी
        </button>
        <span className="text-gray-300" aria-hidden>|</span>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={cn("rounded px-1.5 py-0.5 transition-colors",
            lang === "en" ? "font-semibold text-indigo-600" : "text-gray-500 hover:text-gray-800")}
        >
          English
        </button>
      </div>

      <Input
        label={t(dict.login.email, lang)}
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        leftAdornment={<Mail className="h-4 w-4" />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
      />

      <Input
        label={t(dict.login.password, lang)}
        type={showPassword ? "text" : "password"}
        required
        autoComplete="current-password"
        placeholder="••••••••"
        leftAdornment={<Lock className="h-4 w-4" />}
        rightAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="pointer-events-auto text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:text-indigo-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
      />

      <Button type="submit" size="lg" loading={busy} leftIcon={busy ? undefined : <LogIn className="h-4 w-4" />}>
        {busy ? t(dict.common.loading, lang) : t(dict.login.submit, lang)}
      </Button>

      <Link
        href="/forgot-password"
        className="text-center text-sm text-indigo-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 rounded"
      >
        पासवर्ड विसरलात? · Forgot password?
      </Link>
    </form>
  );
}
