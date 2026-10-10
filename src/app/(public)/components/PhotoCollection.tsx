"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Expand } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import {
  pick, type CaptionStyle, type Columns, type PhotoFit, type PhotoLayout, type PhotoShape, type SectionConfig, type SectionItem,
} from "@/lib/homeSections";
import { cn } from "@/lib/utils";
import { FramedImage } from "./FramedImage";
import { ItemLayout } from "./ItemLayout";
import { Lightbox } from "./Lightbox";
import { Reveal } from "./motion";

/**
 * Photos with a caption and an optional description, laid out the admin's way:
 *   grid / masonry / carousel — tiles, caption on or below the photo
 *   split   — one per row, the text beside the photo (left, right or alternating)
 *   stacked — one per row, full-width photo with the text below
 * A photo without a link opens full screen; with a link it goes there.
 * Used by the Photo gallery section and by the photos any section can carry.
 */
export function PhotoCollection({ items, layout, columns, config }: {
  items: SectionItem[];
  layout: PhotoLayout;
  columns?: Columns;
  config: SectionConfig;
}) {
  const { lang } = useLang();
  const photos = items.filter((p) => p.image_url);
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return null;

  const frame = { shape: config.photo_shape, fit: config.photo_fit };
  const captionStyle: CaptionStyle = config.caption_style ?? (layout === "split" || layout === "stacked" ? "below" : "overlay");
  const center = config.text_align === "center";

  const lightbox = open != null && (
    <Lightbox
      photos={photos.map((p) => ({
        url: p.image_url!,
        caption: [pick(p.caption, lang), pick(p.body, lang)].filter(Boolean).join(" — ") || null,
      }))}
      index={open}
      onIndex={setOpen}
      onClose={() => setOpen(null)}
    />
  );

  if (layout === "split" || layout === "stacked") {
    return (
      <>
        <div className={cn("flex flex-col", layout === "split" ? "gap-[calc(var(--sec-gap,1.5rem)*2.5)]" : "gap-[calc(var(--sec-gap,1.5rem)*2)]")}>
          {photos.map((p, i) =>
            layout === "split"
              ? <SplitRow key={p.id} it={p} i={i} lang={lang} frame={frame} config={config} onOpen={() => setOpen(i)} />
              : <StackedRow key={p.id} it={p} lang={lang} frame={frame} captionStyle={captionStyle} center={center} onOpen={() => setOpen(i)} />,
          )}
        </div>
        {lightbox}
      </>
    );
  }

  return (
    <>
      <ItemLayout layout={layout} columns={columns} gap="1rem" stretch={false}>
        {photos.map((p, i) => (
          <Tile key={p.id} it={p} lang={lang} frame={frame} masonry={layout === "masonry"}
            captionStyle={captionStyle} center={center} onOpen={() => setOpen(i)} />
        ))}
      </ItemLayout>
      {lightbox}
    </>
  );
}

type Frame = { shape?: PhotoShape; fit?: PhotoFit };

/** Wraps a photo in its link, or a button that opens it full screen. */
function PhotoLink({ it, lang, onOpen, className, children }: {
  it: SectionItem; lang: "mr" | "en"; onOpen: () => void; className?: string; children: ReactNode;
}) {
  const label = pick(it.caption, lang) || (lang === "mr" ? "फोटो पहा" : "View photo");
  if (it.link_href) {
    const external = /^https?:\/\//.test(it.link_href);
    return (
      <Link href={it.link_href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={cn("block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300", className)}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onOpen} aria-label={label}
      className={cn("block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300", className)}>
      {children}
    </button>
  );
}

function Corner({ linked }: { linked: boolean }) {
  return (
    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-900 opacity-0 shadow transition-opacity group-hover:opacity-100">
      {linked ? <ArrowUpRight className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
    </span>
  );
}

/** Caption drawn over the photo — along the bottom, or centred in the middle. */
function OverlayCaption({ caption, body, middle }: { caption: string; body: string; middle: boolean }) {
  if (!caption && !body) return null;
  return middle ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-900/40 p-5 text-center text-white transition-colors group-hover:bg-ink-900/55">
      {caption && <div className="font-display text-xl font-semibold leading-snug sm:text-2xl">{caption}</div>}
      {body && <p className="mt-2 line-clamp-3 max-w-md text-sm text-white/85">{body}</p>}
    </div>
  ) : (
    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink-900/85 via-ink-900/30 to-transparent px-4 pb-3 pt-10 text-white">
      {caption && <div className="text-sm font-semibold">{caption}</div>}
      {body && <p className="mt-0.5 line-clamp-2 text-xs text-white/80">{body}</p>}
    </div>
  );
}

function Tile({ it, lang, frame, masonry, captionStyle, center, onOpen }: {
  it: SectionItem; lang: "mr" | "en"; frame: Frame; masonry: boolean; captionStyle: CaptionStyle; center: boolean; onOpen: () => void;
}) {
  const caption = pick(it.caption, lang);
  const body = pick(it.body, lang);
  return (
    <div>
      <PhotoLink it={it} lang={lang} onOpen={onOpen}>
        <FramedImage src={it.image_url!} alt={caption} shape={frame.shape} fit={frame.fit}
          fallback={masonry ? "original" : "4:3"}
          className="group rounded-2xl bg-ink-100"
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-105">
          {(captionStyle === "overlay" || captionStyle === "center") && (
            <OverlayCaption caption={caption} body={body} middle={captionStyle === "center"} />
          )}
          <Corner linked={!!it.link_href} />
        </FramedImage>
      </PhotoLink>
      {captionStyle === "below" && (caption || body) && (
        <div className={cn("px-1 pt-3", center && "text-center")}>
          {caption && <div className="font-display text-base font-semibold text-ink-900">{caption}</div>}
          {body && <p className="mt-1 text-sm leading-relaxed text-ink-600">{body}</p>}
        </div>
      )}
    </div>
  );
}

/** One per row, text beside the photo. */
function SplitRow({ it, i, lang, frame, config, onOpen }: {
  it: SectionItem; i: number; lang: "mr" | "en"; frame: Frame; config: SectionConfig; onOpen: () => void;
}) {
  const caption = pick(it.caption, lang);
  const body = pick(it.body, lang);
  const side = config.split_side ?? "alternate";
  const photoRight = side === "right" || (side === "alternate" && i % 2 === 1);
  const size = config.split_size ?? "half";
  const cols = size === "large" ? "md:grid-cols-[3fr_2fr]" : size === "small" ? "md:grid-cols-[2fr_3fr]" : "md:grid-cols-2";
  const colsFlipped = size === "large" ? "md:grid-cols-[2fr_3fr]" : size === "small" ? "md:grid-cols-[3fr_2fr]" : "md:grid-cols-2";
  const center = config.text_align === "center";
  return (
    <div className={cn("grid grid-cols-1 items-center gap-6 md:gap-12", photoRight ? colsFlipped : cols)}>
      <Reveal from={photoRight ? "right" : "left"} className={cn(photoRight && "md:order-2")}>
        <PhotoLink it={it} lang={lang} onOpen={onOpen}>
          <FramedImage src={it.image_url!} alt={caption} shape={frame.shape} fit={frame.fit} fallback="4:3"
            className="group rounded-3xl bg-ink-100 shadow-lg"
            imgClassName="transition-transform duration-700 ease-out group-hover:scale-105">
            <Corner linked={!!it.link_href} />
          </FramedImage>
        </PhotoLink>
      </Reveal>
      <Reveal from={photoRight ? "left" : "right"} delay={120} className={cn(center && "text-center")}>
        {caption && <h3 className="font-display text-2xl font-semibold leading-tight text-ink-900 sm:text-3xl">{caption}</h3>}
        {body && <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink-600">{body}</p>}
        {it.link_href && (
          <Link href={it.link_href}
            {...(/^https?:\/\//.test(it.link_href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900">
            {pick(it.title, lang) || (lang === "mr" ? "अधिक पहा" : "Learn more")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </Reveal>
    </div>
  );
}

/** One per row, full-width photo with the text below (or over it). */
function StackedRow({ it, lang, frame, captionStyle, center, onOpen }: {
  it: SectionItem; lang: "mr" | "en"; frame: Frame; captionStyle: CaptionStyle; center: boolean; onOpen: () => void;
}) {
  const caption = pick(it.caption, lang);
  const body = pick(it.body, lang);
  const onPhoto = captionStyle === "overlay" || captionStyle === "center";
  return (
    <Reveal>
      <PhotoLink it={it} lang={lang} onOpen={onOpen}>
        <FramedImage src={it.image_url!} alt={caption} shape={frame.shape} fit={frame.fit} fallback="16:9"
          className="group rounded-3xl bg-ink-100 shadow-lg"
          imgClassName="transition-transform duration-1000 ease-out group-hover:scale-105">
          {onPhoto && <OverlayCaption caption={caption} body={body} middle={captionStyle === "center"} />}
          <Corner linked={!!it.link_href} />
        </FramedImage>
      </PhotoLink>
      {!onPhoto && captionStyle !== "hidden" && (caption || body) && (
        <div className={cn("mx-auto max-w-3xl px-1 pt-5", center ? "text-center" : "")}>
          {caption && <h3 className="font-display text-2xl font-semibold leading-tight text-ink-900">{caption}</h3>}
          {body && <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-ink-600">{body}</p>}
        </div>
      )}
    </Reveal>
  );
}
