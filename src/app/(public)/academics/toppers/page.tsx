import { createSupabaseServer } from "@/lib/supabase/server";
import ToppersContent from "./ToppersContent";
import { TOPPER_COLUMNS, type PublicTopper } from "../../lib/showcase";

export const metadata = { title: "Toppers" };

export default async function ToppersPage() {
  const supabase = await createSupabaseServer();
  const { data: toppers } = await supabase
    .from("toppers")
    .select(TOPPER_COLUMNS)
    .eq("is_featured", true)
    .order("rank", { ascending: true });
  return <ToppersContent toppers={(toppers ?? []) as PublicTopper[]} />;
}
