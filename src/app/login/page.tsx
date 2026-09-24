import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("school_settings")
    .select("name, logo_url")
    .limit(1)
    .maybeSingle();

  const name = data?.name || "Saraswati Portal";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Soft decorative gradient — cheaper than an image and looks nicer than plain grey. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(79,70,229,0.12),rgba(255,255,255,0))]"
      />

      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {data?.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.logo_url}
              alt=""
              className="h-16 w-16 rounded-lg object-contain ring-1 ring-gray-100"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-600 text-2xl font-bold text-white shadow-md">
              {name.trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{name}</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              प्रशासक लॉगिन · Admin sign-in
            </p>
          </div>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
