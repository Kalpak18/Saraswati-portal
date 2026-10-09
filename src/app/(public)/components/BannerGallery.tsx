"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { pick, type PhotoFit, type PhotoShape, type SectionItem } from "@/lib/homeSections";
import { FramedImage } from "./FramedImage";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";

/**
 * Admin-uploaded banners laid out for however many there are:
 *   1 → one wide banner · 2 → side by side · 3+ → swipeable row that peeks
 *   the next banner so visitors know there's more.
 * Items without an image are skipped.
 */
export function BannerGallery({ items, tone = "light", frame }: { items: SectionItem[]; tone?: "light" | "dark"; frame?: BannerFrame }) {
  const list = items.filter((i) => i.image_url);
  if (list.length === 0) return null;

  if (list.length === 1) {
    return (
      <Reveal from="scale">
        <BannerCard item={list[0]} className="w-full" priority frame={frame} />
      </Reveal>
    );
  }
  if (list.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {list.map((b, i) => (
          <Reveal key={b.id} delay={i * 120}><BannerCard item={b} className="w-full" frame={frame} /></Reveal>
        ))}
      </div>
    );
  }
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {list.map((b, i) => (
        <Reveal key={b.id} from="right" delay={Math.min(i, 4) * 90} className="snap-start">
          <BannerCard item={b} frame={frame} className={cn("w-[85vw] sm:w-[60vw] lg:w-[46vw] lg:max-w-[760px]", tone === "dark" && "ring-white/10")} />
        </Reveal>
      ))}
    </div>
  );
}

export type BannerFrame = { shape?: PhotoShape; fit?: PhotoFit };

export function BannerCard({ item, className, priority, frame }: {
  item: SectionItem; className?: string; priority?: boolean; frame?: BannerFrame;
}) {
  const { lang } = useLang();
  const title = pick(item.title, lang);
  const caption = pick(item.caption, lang);
  const body = (
    <figure className={cn("group relative flex-none overflow-hidden rounded-3xl bg-ink-800 shadow-2xl ring-1 ring-black/5", className)}>
      <FramedImage src={item.image_url!} alt={title} shape={frame?.shape} fallback="16:9" fit={frame?.fit}
        loading={priority ? "eager" : "lazy"}
        imgClassName="transition-transform duration-[1.6s] ease-out group-hover:scale-105" />
      {(title || caption) && (
        <figcaption className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-900/90 via-ink-900/40 to-transparent p-6 pt-20 text-white sm:p-8 sm:pt-24">
          {title && <div className="font-display text-2xl font-semibold leading-tight sm:text-3xl">{title}</div>}
          {caption && <div className="mt-1.5 max-w-2xl text-sm text-white/80 sm:text-base">{caption}</div>}
        </figcaption>
      )}
      {item.link_href && (
        <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      )}
    </figure>
  );
  if (!item.link_href) return body;
  const external = /^https?:\/\//.test(item.link_href);
  return (
    <Link href={item.link_href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="block rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400">
      {body}
    </Link>
  );
}
