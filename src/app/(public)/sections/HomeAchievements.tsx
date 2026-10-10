"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { toMarathiDigits } from "@/lib/i18n/normalize";
import { layoutOf, pick, type HomeSection } from "@/lib/homeSections";
import { AchievementCard } from "../components/AchievementCard";
import { BannerGallery } from "../components/BannerGallery";
import { Reveal } from "../components/motion";
import { useSectionDesign } from "../components/SectionDesign";
import { TITLE_SIZE } from "../components/SectionHeader";
import { cn } from "@/lib/utils";
import { ItemLayout } from "../components/ItemLayout";
import type { PublicAchievement } from "../lib/showcase";

/**
 * Competitive-exam results. Cards are made automatically from imported
 * results (filtered by the section's exam / category / level); the admin
 * can instead — or as well — show their own ready-made banners.
 * The grid sizes itself to the number of cards.
 */
export default function HomeAchievements({
  s, achievements, matching, stats,
}: {
  s: HomeSection;
  achievements: PublicAchievement[];   // already filtered + limited for this section
  matching: number;                    // how many match the filter in total
  stats: { total: number; statePlus: number; exams: number };
}) {
  const { lang } = useLang();
  const design = useSectionDesign();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const num = (n: number) => (lang === "mr" ? toMarathiDigits(n.toLocaleString("en-IN")) : n.toLocaleString("en-IN"));

  const display = s.config.display ?? "cards";
  const showBanners = display !== "cards" && s.items.some((i) => i.image_url);
  const showCards = display !== "banners" && achievements.length > 0;
  // A section scoped to one exam shouldn't show whole-school totals.
  const scoped = !!(s.config.exam || s.config.category || s.config.min_level);
  if (!showBanners && !showCards) return null;

  const tiles = scoped ? [] : [
    { value: stats.total, label: t("एकूण यश", "Achievements") },
    { value: stats.statePlus, label: t("राज्यस्तर व त्याहून अधिक", "State level & above") },
    { value: stats.exams, label: t("स्पर्धा परीक्षा व उपक्रम", "Exams & competitions") },
  ].filter((x) => x.value > 0);

  const eyebrow = pick(s.content.eyebrow, lang);
  const title = pick(s.content.title, lang);
  const subtitle = pick(s.content.subtitle, lang);
  const seeAllHref = s.config.exam ? `/achievements?exam=${encodeURIComponent(s.config.exam)}` : "/achievements";

  return (
    <section className="relative overflow-hidden bg-ink-900 text-white sec">
      {/* Soft light + dotted texture so the dark band reads as a feature, not a void */}
      <div className="sec-backdrop pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-size-[22px_22px]" />
      </div>

      <div className="relative sec-wrap">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className={cn("max-w-2xl", design.headingAlign === "center" && "mx-auto text-center lg:mx-0")}>
            {eyebrow && (
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-accent-300">
                <span className="h-px w-6 bg-current" />
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className={cn("mt-3 font-display font-semibold leading-tight tracking-tight", TITLE_SIZE[design.headingSize ?? "md"])}>{title}</h2>
            )}
            {subtitle && <p className="mt-3 text-base text-ink-300">{subtitle}</p>}
          </Reveal>

          {tiles.length > 0 && showCards && (
            <Reveal from="right" delay={150}>
              <dl className="grid grid-cols-3 gap-3 sm:gap-4">
                {tiles.map((x) => (
                  <div key={x.label} className="rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur sm:px-5 sm:py-4">
                    <dt className="text-[10px] font-medium uppercase tracking-wider text-ink-400 sm:text-[11px]">{x.label}</dt>
                    <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-accent-300 sm:text-3xl">{num(x.value)}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </div>

        {showBanners && (
          <div className="mt-12">
            <BannerGallery items={s.items} frame={{ shape: s.config.photo_shape, fit: s.config.photo_fit }} tone="dark" />
          </div>
        )}

        {showCards && (
          <ItemLayout layout={layoutOf(s) as "grid" | "carousel"} columns={s.config.columns} gap="1rem" className="mt-12 text-ink-900">
            {achievements.map((a) => <AchievementCard key={a.id} a={a} />)}
          </ItemLayout>
        )}

        {showCards && (
          <div className="mt-10 flex justify-center">
            <Link
              href={seeAllHref}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-accent-50"
            >
              {matching > achievements.length
                ? t(`सर्व ${toMarathiDigits(String(matching))} पहा`, `See all ${matching}`)
                : t("सर्व यश पहा", "See all achievements")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
