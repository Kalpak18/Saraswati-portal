"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calendar } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { Parallax, Reveal } from "../components/motion";
import { BannerGallery } from "../components/BannerGallery";
import { FramedImage } from "../components/FramedImage";
import { ItemLayout } from "../components/ItemLayout";
import { SmartImage, useImageRatio, wouldCropBadly } from "../components/SmartImage";
import { layoutOf, pick, type HomeSection, type PhotoFit, type PhotoShape } from "@/lib/homeSections";

export type HomeEvent = {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
  cover_photo_url: string | null;
  description: string;
  photos: string[];
};

function formatDate(iso: string | null, lang: "mr" | "en") {
  if (!iso) return null;
  return new Date(`${iso}T00:00:00`).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * Each recent event is a chapter: a big cover drifting under its frame,
 * the story beside it, and a few of its photos floating past at different
 * speeds — so scrolling through feels like leafing through an album.
 */
export default function HomeEvents({ events, s }: { events: HomeEvent[]; s: HomeSection }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const display = s.config.display ?? "cards";
  const frame = { shape: s.config.photo_shape, fit: s.config.photo_fit };
  const showBanners = display !== "cards" && s.items.some((i) => i.image_url);
  const showCards = display !== "banners" && events.length > 0;
  if (!showBanners && !showCards) return null;

  return (
    <section className="overflow-hidden bg-ink-50/60 sec">
      <div className="sec-wrap">
        <Reveal>
          <SectionHeader
            eyebrow={pick(s.content.eyebrow, lang)}
            title={pick(s.content.title, lang)}
            subtitle={pick(s.content.subtitle, lang) || undefined}
            action={{ href: "/life", label: t("सर्व कार्यक्रम", "All events") }}
          />
        </Reveal>

        {showBanners && (
          <div className="mt-12">
            <BannerGallery items={s.items} frame={{ shape: s.config.photo_shape, fit: s.config.photo_fit }} />
          </div>
        )}

        {showCards && layoutOf(s) === "auto" && (
          <div className="mt-16 space-y-28 sm:space-y-36">
            {events.map((e, i) => (
              <EventChapter key={e.id} e={e} flip={i % 2 === 1} lang={lang} frame={frame} />
            ))}
          </div>
        )}
        {showCards && layoutOf(s) !== "auto" && (
          <ItemLayout layout={layoutOf(s) as "grid" | "carousel"} columns={s.config.columns} className="mt-12">
            {events.map((e) => <EventCard key={e.id} e={e} lang={lang} frame={frame} />)}
          </ItemLayout>
        )}

        <Reveal className="mt-20 flex justify-center">
          <Link
            href="/life"
            className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
          >
            {t("आणखी क्षण पहा", "See more moments")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

type Frame = { shape?: PhotoShape; fit?: PhotoFit };

function EventChapter({ e, flip, lang, frame }: { e: HomeEvent; flip: boolean; lang: "mr" | "en"; frame: Frame }) {
  const cover = e.cover_photo_url ?? e.photos[0] ?? null;
  const extras = e.photos.filter((p) => p !== cover).slice(0, 3);
  const date = formatDate(e.event_date, lang);
  // Posters / flyers / screenshots are shown whole instead of cropped.
  const poster = wouldCropBadly(useImageRatio(cover), 16 / 10);

  return (
    <article className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
      {/* Cover + floating photos */}
      <div className={cn("relative lg:col-span-7", flip && "lg:order-2")}>
        <Reveal from="scale">
          <Link href={`/life/${e.slug}`} className="group block overflow-hidden rounded-3xl bg-ink-200 shadow-xl">
            {cover && poster && !(frame.shape || frame.fit) ? (
              <div className="aspect-4/3 sm:aspect-16/10">
                <SmartImage src={cover} frameRatio={16 / 10}
                  imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
              </div>
            ) : cover && !(frame.shape || frame.fit === "contain") ? (
              // Default look: cropped cover drifting under its frame.
              <div className="aspect-4/3 overflow-hidden sm:aspect-16/10">
                <Parallax speed={-90} className="h-[115%] translate-y-[-7%]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cover} alt="" loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                </Parallax>
              </div>
            ) : cover ? (
              <FramedImage src={cover} shape={frame.shape} fallback="4:3" fit={frame.fit}
                imgClassName="transition-transform duration-1000 ease-out group-hover:scale-105" />
            ) : (
              <div className="flex aspect-4/3 items-center justify-center bg-linear-to-br from-brand-100 to-accent-100 text-brand-700 sm:aspect-16/10">
                <Calendar className="h-16 w-16 opacity-40" />
              </div>
            )}
          </Link>
        </Reveal>

        {extras.length > 0 && (
          <div className={cn(
            "pointer-events-none absolute -bottom-10 hidden gap-3 sm:flex",
            flip ? "-left-6" : "-right-6",
          )}>
            {extras.map((src, j) => (
              <Parallax key={src} speed={60 + j * 50}>
                <Reveal from="up" delay={200 + j * 120}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy"
                    className={cn(
                      "h-28 w-36 rounded-2xl object-cover shadow-2xl ring-4 ring-white lg:h-36 lg:w-48",
                      j === 1 && "translate-y-6",
                      j === 2 && "-translate-y-4",
                    )} />
                </Reveal>
              </Parallax>
            ))}
          </div>
        )}
      </div>

      {/* Story */}
      <div className={cn("lg:col-span-5", flip && "lg:order-1")}>
        <Reveal from={flip ? "left" : "right"} delay={150}>
          {date && (
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-700">
              <Calendar className="h-3.5 w-3.5" /> <span className="tabular-nums">{date}</span>
            </div>
          )}
          <h3 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl">
            {e.title}
          </h3>
          {e.description && (
            <p className="mt-4 line-clamp-5 text-base leading-relaxed text-ink-600">{e.description}</p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/life/${e.slug}`}
              className="group inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
            >
              {lang === "mr" ? "कार्यक्रम पहा" : "View event"}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            {e.photos.length > 1 && (
              <span className="text-sm text-ink-500">
                {lang === "mr" ? `${e.photos.length} फोटो` : `${e.photos.length} photos`}
              </span>
            )}
          </div>
        </Reveal>
      </div>
    </article>
  );
}

/** Compact event card for the grid / carousel layouts. */
function EventCard({ e, lang, frame }: { e: HomeEvent; lang: "mr" | "en"; frame: Frame }) {
  const cover = e.cover_photo_url ?? e.photos[0] ?? null;
  const date = formatDate(e.event_date, lang);
  return (
    <Link href={`/life/${e.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {cover ? (
        <FramedImage src={cover} shape={frame.shape} fallback="16:9" fit={frame.fit} className="bg-ink-100"
          imgClassName="transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="flex aspect-16/9 items-center justify-center bg-linear-to-br from-brand-100 to-accent-100 text-brand-700">
          <Calendar className="h-10 w-10 opacity-40" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        {date && <div className="text-[11px] font-semibold uppercase tracking-widest text-brand-700 tabular-nums">{date}</div>}
        <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-ink-900 group-hover:text-brand-800">{e.title}</h3>
        {e.description && <p className="mt-1.5 line-clamp-2 text-sm text-ink-600">{e.description}</p>}
        {e.photos.length > 0 && (
          <span className="mt-auto pt-3 text-xs font-medium text-ink-500">
            {lang === "mr" ? `${e.photos.length} फोटो` : `${e.photos.length} photo${e.photos.length === 1 ? "" : "s"}`}
          </span>
        )}
      </div>
    </Link>
  );
}
