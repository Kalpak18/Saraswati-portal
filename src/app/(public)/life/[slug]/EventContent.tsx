"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Calendar, Expand, Images } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { cn } from "@/lib/utils";
import { Reveal, useScrollProgress } from "../../components/motion";
import { Lightbox, type LightboxPhoto } from "../../components/Lightbox";
import { useImageRatio } from "../../components/SmartImage";

type Photo = LightboxPhoto;

export default function EventContent({
  event,
}: {
  event: { title: string; event_date: string | null; description: string; cover: string | null; photos: Photo[] };
}) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const heroRef = useRef<HTMLElement>(null);
  useScrollProgress(heroRef, "leave");
  const [open, setOpen] = useState<number | null>(null);

  // A landscape photo makes a full-bleed cover; a poster, flyer or
  // screenshot is shown whole beside the title instead of blown up and cropped.
  const ratio = useImageRatio(event.cover);
  const known = !event.cover || ratio != null;
  const poster = ratio != null && ratio < 1.2;

  // The lightbox shows the cover too, so "view full size" always works.
  const photos: Photo[] = event.cover && !event.photos.some((p) => p.url === event.cover)
    ? [{ url: event.cover, caption: null }, ...event.photos]
    : event.photos;
  const coverIndex = Math.max(0, photos.findIndex((p) => p.url === event.cover));
  // Don't repeat a lone poster that the header already shows in full.
  const gallery = poster ? photos.filter((p) => p.url !== event.cover) : event.photos;

  const date = event.event_date
    ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const titleBlock = (
    <>
      <Link href="/life" className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/85 backdrop-blur hover:bg-white/20 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> {t("शालेय जीवन", "School life")}
      </Link>
      {date && (
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
          <Calendar className="h-3.5 w-3.5" /> {date}
        </div>
      )}
      <h1 className="mt-3 max-w-4xl text-balance font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
        {event.title}
      </h1>
    </>
  );

  return (
    <>
      {poster ? (
        /* Poster layout: blurred backdrop, title beside the whole poster */
        <section ref={heroRef} className="relative isolate overflow-hidden bg-ink-900 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.cover!} alt="" aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-40 blur-3xl" />
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-ink-900/80 via-ink-900/60 to-brand-950/70" />
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8 lg:py-16">
            <div className="lg:col-span-6">
              {titleBlock}
              {event.description && (
                <p className="mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-white/80 sm:text-lg">{event.description}</p>
              )}
              {gallery.length > 0 && (
                <a href="#photos" className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 shadow-lg hover:bg-ink-100">
                  <Images className="h-4 w-4" />
                  {t(`${gallery.length} फोटो पहा`, `See ${gallery.length} photo${gallery.length === 1 ? "" : "s"}`)}
                </a>
              )}
            </div>
            <div className="lg:col-span-6">
              <button
                type="button"
                onClick={() => setOpen(coverIndex)}
                className="group relative mx-auto block w-fit overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-white/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-300"
                aria-label={t("पूर्ण आकारात पहा", "View full size")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.cover!} alt={event.title} className="block max-h-[72svh] w-auto max-w-full object-contain" />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-ink-900/75 px-3 py-1.5 text-xs font-medium text-white opacity-90 backdrop-blur transition-opacity group-hover:opacity-100">
                  <Expand className="h-3.5 w-3.5" /> {t("पूर्ण आकारात पहा", "View full size")}
                </span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        /* Photo layout: full-bleed cover drifting as you scroll */
        <section ref={heroRef} className="relative isolate h-[70svh] min-h-105 overflow-hidden bg-ink-900">
          {event.cover && (
            <div className={cn("absolute inset-0 transition-opacity duration-500", known ? "opacity-100" : "opacity-0")}
              style={{ transform: "scale(calc(1.02 + var(--p, 0) * 0.15))" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.cover} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          {!event.cover && <div className="absolute inset-0 bg-linear-to-br from-brand-800 via-ink-900 to-ink-900" />}
          <div className="absolute inset-0 bg-linear-to-t from-ink-900/90 via-ink-900/30 to-ink-900/20" />
          <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-12 text-white sm:px-6 lg:px-8"
            style={{ transform: "translate3d(0, calc(var(--p, 0) * -80px), 0)" }}>
            {titleBlock}
          </div>
        </section>
      )}

      {event.description && !poster && (
        <Reveal className="mx-auto max-w-3xl px-4 pt-14 sm:px-6">
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink-700">{event.description}</p>
        </Reveal>
      )}

      {/* Gallery — sized by how many photos there are; masonry keeps every photo's own shape */}
      {gallery.length > 0 && (
        <section id="photos" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">
              {t("फोटो", "Photos")} · {gallery.length}
            </span>
          </div>
          <div className={cn(
            "gap-3 sm:gap-4",
            gallery.length === 1 ? "mx-auto max-w-4xl" :
            gallery.length === 2 ? "columns-1 sm:columns-2" :
            gallery.length === 3 ? "columns-1 sm:columns-3" :
            "columns-2 sm:columns-3 lg:columns-4",
          )}>
            {gallery.map((p, i) => (
              <Reveal key={p.url} delay={(i % 4) * 80} className="mb-3 break-inside-avoid sm:mb-4">
                <figure>
                  <button
                    type="button"
                    onClick={() => setOpen(photos.findIndex((x) => x.url === p.url))}
                    className="group block w-full overflow-hidden rounded-2xl bg-ink-100 shadow-sm ring-1 ring-ink-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                    aria-label={p.caption || t(`फोटो ${i + 1}`, `Photo ${i + 1}`)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption ?? ""} loading="lazy"
                      className={cn("w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]", gallery.length === 1 && "max-h-[80svh] object-contain")} />
                  </button>
                  {p.caption && <figcaption className="mt-2 px-1 text-sm text-ink-600">{p.caption}</figcaption>}
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {!gallery.length && !event.description && !poster && <div className="h-16" />}

      {open != null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
