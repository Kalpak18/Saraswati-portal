"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { layoutOf, pick, type CardStyle, type HomeSection, type PhotoFit, type PhotoShape, type SectionItem } from "@/lib/homeSections";
import { cn } from "@/lib/utils";
import { FeatureIcon } from "@/components/FeatureIcon";
import { FramedImage } from "../components/FramedImage";
import { SectionHeader } from "../components/SectionHeader";
import { Reveal } from "../components/motion";
import { ItemLayout } from "../components/ItemLayout";

/**
 * Feature cards — admin-edited. Three looks: icon cards, photo-on-top cards,
 * and full-photo cards with the caption over the image. A card without a
 * photo falls back to its icon so mixed sections still line up.
 */
export default function HomeFacilities({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  const items = s.items.filter((it) => pick(it.title, lang) || it.image_url);
  if (items.length === 0) return null;
  // A cards section may have no heading at all (the About pillars don't).
  const heading = pick(s.content.title, lang) || pick(s.content.eyebrow, lang);
  const style: CardStyle = s.config.card_style ?? "icon";
  const frame = { shape: s.config.photo_shape, fit: s.config.photo_fit };

  return (
    <section className="border-y border-ink-100 bg-ink-50/60 sec">
      <div className="sec-wrap">
        {heading && (
          <Reveal>
            <SectionHeader
              eyebrow={pick(s.content.eyebrow, lang)}
              title={pick(s.content.title, lang)}
              subtitle={pick(s.content.subtitle, lang) || undefined}
              align="center"
            />
          </Reveal>
        )}

        <ItemLayout layout={layoutOf(s) as "grid" | "carousel"} columns={s.config.columns} className={heading ? "mt-14" : undefined}>
          {items.map((it) => (
            <CardLink key={it.id} href={it.link_href}>
              {style === "overlay" && it.image_url ? <OverlayCard it={it} lang={lang} frame={frame} />
                : style !== "icon" && it.image_url ? <PhotoCard it={it} lang={lang} frame={frame} />
                : <IconCard it={it} lang={lang} linked={!!it.link_href} />}
            </CardLink>
          ))}
        </ItemLayout>
      </div>
    </section>
  );
}

function CardLink({ href, children }: { href?: string | null; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  const external = /^https?:\/\//.test(href);
  return (
    <Link href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group/link block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300">
      {children}
    </Link>
  );
}

const cardShell = "group relative h-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl";

function IconCard({ it, lang, linked }: { it: SectionItem; lang: "mr" | "en"; linked: boolean }) {
  return (
    <div className={cn(cardShell, "p-6")}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-brand-50 to-accent-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:from-brand-100 group-hover:to-accent-100">
        <FeatureIcon name={it.icon} className="h-6 w-6" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-900">{pick(it.title, lang)}</h3>
      {pick(it.body, lang) && <p className="mt-2 text-sm leading-relaxed text-ink-600">{pick(it.body, lang)}</p>}
      {linked && <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-ink-300 transition-colors group-hover:text-brand-700" />}
    </div>
  );
}

type Frame = { shape?: PhotoShape; fit?: PhotoFit };

function PhotoCard({ it, lang, frame }: { it: SectionItem; lang: "mr" | "en"; frame: Frame }) {
  const title = pick(it.title, lang);
  const body = pick(it.body, lang);
  return (
    <div className={cn(cardShell, "flex flex-col")}>
      <FramedImage src={it.image_url!} alt={title} shape={frame.shape} fallback="4:3" fit={frame.fit}
        className="bg-ink-100" imgClassName="transition-transform duration-700 ease-out group-hover:scale-105" />
      {(title || body) && (
        <div className="flex flex-1 flex-col p-5 sm:p-6">
          {title && <h3 className="font-display text-lg font-semibold leading-snug text-ink-900 group-hover:text-brand-800">{title}</h3>}
          {body && <p className="mt-2 text-sm leading-relaxed text-ink-600">{body}</p>}
          {it.link_href && (
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-700">
              {lang === "mr" ? "अधिक पहा" : "Learn more"} <ArrowUpRight className="h-4 w-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function OverlayCard({ it, lang, frame }: { it: SectionItem; lang: "mr" | "en"; frame: Frame }) {
  const title = pick(it.title, lang);
  const body = pick(it.body, lang);
  return (
    <figure className={cn(cardShell, "bg-ink-800 ring-0")}>
      <FramedImage src={it.image_url!} alt={title} shape={frame.shape} fallback="3:4" fit={frame.fit}
        imgClassName="transition-transform duration-1000 ease-out group-hover:scale-105">
        <div className="absolute inset-0 bg-linear-to-t from-ink-900/90 via-ink-900/25 to-transparent" />
      </FramedImage>
      {(title || body) && (
        <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white">
          {title && <h3 className="font-display text-xl font-semibold leading-snug">{title}</h3>}
          {body && (
            // On devices that hover, the caption slides up on hover; on touch it's always shown.
            <p className="mt-2 text-sm leading-relaxed text-white/85 transition-all duration-500 [@media(hover:hover)]:max-h-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:max-h-40 [@media(hover:hover)]:group-hover:opacity-100">
              {body}
            </p>
          )}
        </figcaption>
      )}
      {it.link_href && (
        <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      )}
    </figure>
  );
}
