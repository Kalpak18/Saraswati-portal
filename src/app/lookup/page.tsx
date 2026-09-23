import LookupForm from "./LookupForm";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function LookupPage() {
  const supabase = await createSupabaseServer();
  const { data: school } = await supabase
    .from("school_settings")
    .select("name, logo_url")
    .limit(1)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          {school?.logo_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={school.logo_url} alt="" className="h-16 w-16 rounded object-contain" />
          )}
          <h1 className="text-xl font-semibold text-gray-900">{school?.name || "Saraswati Portal"}</h1>
          <p className="text-sm text-gray-500">परिणाम पहा · View Result</p>
        </div>
        <LookupForm />
      </div>
    </div>
  );
}
