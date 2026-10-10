import { createSupabaseServer } from "@/lib/supabase/server";
import { getSchoolInfo } from "@/lib/school";
import { heroHeightFromRow, slideEffectFromRow, slideSecondsFromRow, slidesFromRow } from "@/lib/hero";
import HeroEditor from "./HeroEditor";

export const dynamic = "force-dynamic";

export default async function HeroEditorPage() {
  const supabase = await createSupabaseServer();
  const [{ data }, school] = await Promise.all([
    // select("*"): works before and after the slides column exists.
    supabase.from("hero_content").select("*").limit(1).maybeSingle(),
    getSchoolInfo(),
  ]);

  return (
    <HeroEditor
      schoolName={school.name || "Saraswati Vidyalaya"}
      initial={{ title: data?.title ?? "", slides: slidesFromRow(data), slide_seconds: slideSecondsFromRow(data), slide_effect: slideEffectFromRow(data), hero_height: heroHeightFromRow(data) }}
    />
  );
}
