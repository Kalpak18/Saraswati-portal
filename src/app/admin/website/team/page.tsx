import { createSupabaseServer } from "@/lib/supabase/server";
import TeamClient, { type Member } from "./TeamClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Team" };

export default async function TeamPage() {
  const supabase = await createSupabaseServer();
  // select("*"): works before and after launch.sql adds the extra columns.
  const { data, error } = await supabase.from("team_members").select("*").order("display_order", { ascending: true });
  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Couldn&apos;t load the team: {error.message}
      </div>
    );
  }
  const columnsReady = !data?.length || "show_contact" in (data[0] ?? {});
  return <TeamClient members={(data ?? []) as Member[]} columnsReady={columnsReady} />;
}
