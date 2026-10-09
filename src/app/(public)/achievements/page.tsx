import { createSupabaseServer } from "@/lib/supabase/server";
import AchievementsContent from "./AchievementsContent";
import { ACHIEVEMENT_COLUMNS, type PublicAchievement } from "../lib/showcase";

export const metadata = {
  title: "Achievements",
  description: "Olympiad, NMMS, scholarship, sports and cultural achievements of our students.",
};

export default async function AchievementsPage(props: PageProps<"/achievements">) {
  const { exam } = await props.searchParams;
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("achievements")
    .select(ACHIEVEMENT_COLUMNS)
    .eq("is_published", true)
    .order("achieved_on", { ascending: false, nullsFirst: false })
    .limit(2000);
  return (
    <AchievementsContent
      rows={(data ?? []) as PublicAchievement[]}
      initialExam={typeof exam === "string" ? exam : ""}
    />
  );
}
