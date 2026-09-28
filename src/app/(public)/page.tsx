import { createSupabaseServer } from "@/lib/supabase/server";
import HomeHero from "./sections/HomeHero";
import HomeStrip from "./sections/HomeStrip";
import HomeWelcome from "./sections/HomeWelcome";
import HomeToppers from "./sections/HomeToppers";
import HomeEvents from "./sections/HomeEvents";
import HomeAchievements from "./sections/HomeAchievements";
import HomeFacilities from "./sections/HomeFacilities";
import HomeVoices from "./sections/HomeVoices";
import HomeCTA from "./sections/HomeCTA";

/**
 * Single-page school home. Sections are individual components in
 * ./sections/ so each can be re-ordered, removed, or later CMS-ified
 * without touching the others.
 */
export default async function HomePage() {
  const supabase = await createSupabaseServer();

  const [{ data: hero }, { data: events }, { data: toppers }, { data: achievements }, { count: studentsCount }] =
    await Promise.all([
      supabase
        .from("hero_content")
        .select("title, tagline, cover_photo_url, primary_cta_label, primary_cta_href, secondary_cta_label, secondary_cta_href, meta_line")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("events")
        .select("id, title, slug, event_date, cover_photo_url, description")
        .eq("is_published", true)
        .order("event_date", { ascending: false, nullsFirst: false })
        .limit(3),
      supabase
        .from("toppers")
        .select("id, rank, note, photo_url, students(id, student_name, gr_no), exams(test_type, academic_year, exam_start_date)")
        .eq("is_featured", true)
        .order("rank", { ascending: true })
        .limit(8),
      supabase
        .from("achievements")
        .select("id, title, description, category, achieved_on, photo_url")
        .eq("is_published", true)
        .order("achieved_on", { ascending: false, nullsFirst: false })
        .limit(6),
      supabase.from("students").select("id", { count: "exact", head: true }),
    ]);

  return (
    <>
      <HomeHero
        data={{
          title: hero?.title ?? "",
          tagline: hero?.tagline ?? "",
          cover_photo_url: hero?.cover_photo_url ?? null,
          primary_cta_label: hero?.primary_cta_label ?? "परिणाम पहा · Check Result",
          primary_cta_href: hero?.primary_cta_href ?? "/lookup",
          secondary_cta_label: hero?.secondary_cta_label ?? null,
          secondary_cta_href: hero?.secondary_cta_href ?? null,
          meta_line: hero?.meta_line ?? null,
        }}
      />
      <HomeStrip studentsCount={studentsCount ?? 0} />
      <HomeWelcome />
      <HomeToppers toppers={toppers ?? []} />
      <HomeEvents events={events ?? []} />
      <HomeAchievements achievements={achievements ?? []} />
      <HomeFacilities />
      <HomeVoices />
      <HomeCTA />
    </>
  );
}
