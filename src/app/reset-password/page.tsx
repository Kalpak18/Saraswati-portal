import { redirect } from "next/navigation";
import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?expired=1");

  const { data } = await supabase
    .from("school_settings")
    .select("name, logo_url")
    .limit(1)
    .maybeSingle();

  const name = data?.name || "Saraswati School";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-br from-brand-50 via-white to-accent-50" />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(15,118,110,0.15),rgba(255,255,255,0))]" />

      <div className="w-full max-w-sm rounded-3xl border border-ink-100 bg-white p-8 shadow-xl shadow-brand-950/5">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {data?.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.logo_url} alt="" className="h-16 w-16 rounded-xl object-contain ring-1 ring-ink-100" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br from-brand-700 to-brand-900 font-display text-2xl font-bold text-white shadow-md">
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900">{name}</h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-ink-500">
              नवीन पासवर्ड · Set new password
            </p>
          </div>
        </div>

        <ResetPasswordForm email={user.email ?? ""} />

        <div className="mt-8 border-t border-ink-100 pt-5 text-center text-xs text-ink-500">
          <Link href="/login" className="hover:text-brand-700 hover:underline">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
