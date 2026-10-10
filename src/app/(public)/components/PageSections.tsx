import { createSupabaseServer } from "@/lib/supabase/server";
import { getSchoolInfo } from "@/lib/school";
import { loadHomeSections } from "@/lib/homeSectionsServer";
import { PAGES, kindSpec, spacingVars, toneOf, type HomeSection, type SitePage } from "@/lib/homeSections";
import { levelRank } from "@/lib/achievements";
import { NOTICE_COLUMNS, type PublicNotice } from "@/lib/notices";
import HomeStatement from "../sections/HomeStatement";
import HomeNotices from "../sections/HomeNotices";
import HomeBanners from "../sections/HomeBanners";
import HomeToppers from "../sections/HomeToppers";
import HomeAchievements from "../sections/HomeAchievements";
import HomeEvents, { type HomeEvent } from "../sections/HomeEvents";
import HomeFacilities from "../sections/HomeFacilities";
import HomeGallery from "../sections/HomeGallery";
import HomeVoices from "../sections/HomeVoices";
import HomeText from "../sections/HomeText";
import HomeCTA from "../sections/HomeCTA";
import { NoticeTicker } from "./NoticeTicker";
import { SectionIntro } from "./SectionIntro";
import { SectionPhotos } from "./SectionPhotos";
import { AdminEmptyNotice } from "./AdminEmptyNotice";
import { SectionDesignProvider } from "./SectionDesign";
import {
  ACHIEVEMENT_COLUMNS, TOPPER_COLUMNS, byPrestige, type PublicAchievement, type PublicTopper,
} from "../lib/showcase";

/**
 * Renders a page's sections in the order the admin arranged them in
 * Website → Home page / About page (or the built-in default layout until
 * they do). Only the data the visible sections need is fetched.
 */
export async function PageSections({ page }: { page: SitePage }) {
  const supabase = await createSupabaseServer();
  const [{ sections: all }, school] = await Promise.all([loadHomeSections(page), getSchoolInfo()]);
  const sections = all.filter((s) => s.is_visible);
  const has = (k: HomeSection["kind"]) => sections.some((s) => s.kind === k);
  const maxLimit = (k: HomeSection["kind"], fallback: number) =>
    Math.max(fallback, ...sections.filter((s) => s.kind === k).map((s) => s.config.limit ?? fallback));

  const none = Promise.resolve({ data: null });
  const [{ data: notices }, { data: toppers }, { data: achievements }, { data: stats }, { data: events }] =
    await Promise.all([
      has("notices") || has("ticker")
        // RLS limits visitors to live notices (published, started, not expired).
        ? supabase.from("notices").select(NOTICE_COLUMNS)
            .order("is_pinned", { ascending: false }).order("publish_on", { ascending: false }).limit(24)
        : none,
      has("toppers")
        ? supabase.from("toppers").select(TOPPER_COLUMNS).eq("is_featured", true)
            .order("academic_year", { ascending: false, nullsFirst: false }).order("rank", { ascending: true }).limit(60)
        : none,
      has("achievements")
        ? supabase.from("achievements").select(ACHIEVEMENT_COLUMNS).eq("is_published", true)
            .order("achieved_on", { ascending: false, nullsFirst: false }).limit(500)
        : none,
      // Counts via a security-definer function: anon cannot read students.
      has("achievements") ? supabase.rpc("public_site_stats") : none,
      has("events")
        ? supabase.from("events")
            .select("id, title, slug, event_date, cover_photo_url, description, event_photos(photo_url, display_order)")
            .eq("is_published", true).order("event_date", { ascending: false, nullsFirst: false })
            .limit(maxLimit("events", 3))
        : none,
    ]);

  const liveNotices = (notices ?? []) as PublicNotice[];
  const allAchievements = (achievements ?? []) as PublicAchievement[];
  const st = (stats ?? null) as { achievements?: number; state_plus?: number; exams?: number } | null;
  const storyEvents: HomeEvent[] = ((events ?? []) as {
    id: string; title: string; slug: string; event_date: string | null; cover_photo_url: string | null;
    description: string | null; event_photos: { photo_url: string; display_order: number }[] | null;
  }[]).map((e) => ({
    id: e.id, title: e.title, slug: e.slug, event_date: e.event_date, cover_photo_url: e.cover_photo_url,
    description: e.description ?? "",
    photos: (e.event_photos ?? []).sort((a, b) => a.display_order - b.display_order).map((p) => p.photo_url),
  }));

  function render(s: HomeSection) {
    const limit = s.config.limit;
    switch (s.kind) {
      case "intro": return <SectionIntro s={s} />;
      case "ticker": {
        // Pinned notices scroll; with none pinned, the newest few.
        const pinned = liveNotices.filter((n) => n.is_pinned);
        const list = (pinned.length ? pinned : liveNotices).slice(0, limit ?? 5);
        return <NoticeTicker notices={list} label={s.content.title} />;
      }
      case "statement": return <HomeStatement s={s} />;
      case "notices": return <HomeNotices s={s} notices={liveNotices.slice(0, limit ?? 5)} />;
      case "banners": return <HomeBanners s={s} />;
      case "toppers": return <HomeToppers s={s} toppers={(toppers ?? []) as PublicTopper[]} />;
      case "achievements": {
        const matched = allAchievements.filter((a) =>
          (!s.config.category || a.category === s.config.category) &&
          (!s.config.exam || (a.exam_name || a.title) === s.config.exam) &&
          (!s.config.min_level || levelRank(a.level) >= levelRank(s.config.min_level)),
        ).sort(byPrestige);
        return (
          <HomeAchievements
            s={s}
            achievements={matched.slice(0, limit ?? 6)}
            matching={matched.length}
            stats={{ total: st?.achievements ?? 0, statePlus: st?.state_plus ?? 0, exams: st?.exams ?? 0 }}
          />
        );
      }
      case "events": return <HomeEvents s={s} events={storyEvents.slice(0, limit ?? 3)} />;
      case "facilities": return <HomeFacilities s={s} />;
      case "gallery": return <HomeGallery s={s} />;
      case "testimonials": return <HomeVoices s={s} />;
      case "text": return <HomeText s={s} />;
      case "cta": return <HomeCTA s={s} address={school.address} mapUrl={school.map_url} phone={school.phone} />;
    }
  }

  // Why a section would render nothing right now (null = it has content).
  const hasImages = (list?: { image_url?: string | null }[]) => (list ?? []).some((x) => !!x.image_url);
  const hasText = (b?: { en: string; mr: string }) => !!(b?.en?.trim() || b?.mr?.trim());
  function emptyReason(s: HomeSection): { reason: string; action: { href: string; label: string } } | null {
    const builder = PAGES.find((p) => p.page === page)!.admin;
    const showsBanners = (s.config.display ?? "cards") !== "cards" && hasImages(s.items);
    switch (s.kind) {
      case "ticker":
      case "notices":
        return liveNotices.length ? null : { reason: "There are no live notices yet.", action: { href: "/admin/website/notices", label: "Post a notice" } };
      case "toppers":
        return (toppers ?? []).length ? null : { reason: "No toppers have been published yet.", action: { href: "/admin/website/toppers", label: "Find toppers" } };
      case "achievements": {
        const matched = allAchievements.some((a) =>
          (!s.config.category || a.category === s.config.category) &&
          (!s.config.exam || (a.exam_name || a.title) === s.config.exam) &&
          (!s.config.min_level || levelRank(a.level) >= levelRank(s.config.min_level)));
        const cards = (s.config.display ?? "cards") !== "banners" && matched;
        return cards || showsBanners ? null : {
          reason: allAchievements.length ? "No results match this section's filters." : "No competitive-exam results have been imported yet.",
          action: { href: "/admin/website/achievements/import", label: "Import results" },
        };
      }
      case "events": {
        const cards = (s.config.display ?? "cards") !== "banners" && storyEvents.length > 0;
        return cards || showsBanners ? null : { reason: "No published events yet.", action: { href: "/admin/website/events/new", label: "Add an event" } };
      }
      case "banners":
      case "gallery":
        return hasImages(s.items) ? null : { reason: "No photos have been added to it yet.", action: { href: builder, label: "Add photos" } };
      case "facilities":
      case "testimonials":
        return s.items.length ? null : { reason: "It has no items yet.", action: { href: builder, label: "Add items" } };
      case "statement":
        return hasText(s.content.body) ? null : { reason: "Its text is empty.", action: { href: builder, label: "Write it" } };
      case "text":
        return hasText(s.content.title) || hasText(s.content.body) || s.content.image_url ? null
          : { reason: "It has no heading, text or photo yet.", action: { href: builder, label: "Fill it in" } };
      case "cta":
      case "intro":
        return hasText(s.content.title) || hasText(s.content.body) ? null : { reason: "Its heading is empty.", action: { href: builder, label: "Write it" } };
    }
    return null;
  }

  // Only look up the session when an empty section might need the admin notice.
  const empties = new Map(sections.map((s) => [s.id, emptyReason(s)]));
  const anyEmpty = Array.from(empties.values()).some(Boolean);
  const isAdmin = anyEmpty ? !!(await supabase.auth.getUser()).data.user : false;

  return (
    <>
      {sections.map((s) => {
        const empty = empties.get(s.id);
        const photos = hasImages(s.content.photos);
        const spec = kindSpec(s.kind)!;
        const label = pickLabel(s) || spec.label;
        return (
          // `contents` keeps the layout untouched; the spacing variables still
          // inherit down to the section (custom properties follow the DOM).
          <div
            key={s.id}
            // Device visibility from the Design panel.
            className={s.config.show_on === "desktop" ? "hidden md:contents" : s.config.show_on === "mobile" ? "contents md:hidden" : "contents"}
            style={spacingVars(s.config)}
            data-bg={s.config.background && s.config.background !== "default" ? s.config.background : undefined}
            data-tone={toneOf(s.kind)}
          >
            <SectionDesignProvider value={{
              headingAlign: s.config.heading_align,
              headingSize: s.config.heading_size,
              animation: s.config.animation,
            }}>
              {!empty && render(s)}
              {photos && <SectionPhotos s={s} withHeading={!!empty} />}
              {empty && !photos && isAdmin && <AdminEmptyNotice label={label} reason={empty.reason} action={empty.action} />}
            </SectionDesignProvider>
          </div>
        );
      })}
    </>
  );
}

function pickLabel(s: HomeSection): string {
  return s.content.title?.en || s.content.eyebrow?.en || s.content.title?.mr || "";
}
