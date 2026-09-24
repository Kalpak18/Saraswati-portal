import { Suspense } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function ForgotPasswordPage() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("school_settings").select("name, logo_url").limit(1).single();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-2">
          {data?.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.logo_url} alt="" className="h-16 w-16 rounded object-contain" />
          )}
          <h1 className="text-center text-xl font-semibold text-gray-900">
            {data?.name || "Saraswati Portal"}
          </h1>
        </div>
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
