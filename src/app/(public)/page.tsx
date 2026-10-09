import { createSupabaseServer } from "@/lib/supabase/server";
import { getSchoolInfo } from "@/lib/school";
import HomeHero from "./sections/HomeHero";
import { PageSections } from "./components/PageSections";
import { heroHeightFromRow, slideEffectFromRow, slideSecondsFromRow, slidesFromRow } from "@/lib/hero";

/**
 * Home: the full-screen hero, then whatever sections the admin arranged in
 * Website → Home page.
 */
export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const [school, { data: hero }] = await Promise.all([
    getSchoolInfo(),
    // select("*"): works before and after the slides column exists.
    supabase.from("hero_content").select("*").limit(1).maybeSingle(),
  ]);

  return (
    <>
      <HomeHero
        data={{
          title: hero?.title ?? "",
          school: { name: school.name, name_mr: school.name_mr },
          slides: slidesFromRow(hero),
          slideSeconds: slideSecondsFromRow(hero),
          slideEffect: slideEffectFromRow(hero),
          height: heroHeightFromRow(hero),
          logo_url: school.logo_url,
          branding: school.branding,
        }}
      />
      <PageSections page="home" />
    </>
  );
}
