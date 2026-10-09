"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Calendar } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { Reveal, useScrollProgress } from "../../components/motion";
import { Lightbox, type LightboxPhoto } from "../../components/Lightbox";

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

  const date = event.event_date
    ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <>
      {/* Cover */}
      <section ref={heroRef} className="relative isolate h-[70svh] min-h-105 overflow-hidden bg-ink-900">
        {event.cover && (
          <div className="absolute inset-0" style={{ transform: "scale(calc(1.02 + var(--p, 0) * 0.15))" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.cover} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-ink-900/90 via-ink-900/30 to-ink-900/20" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-12 text-white sm:px-6 lg:px-8"
          style={{ transform: "translate3d(0, calc(var(--p, 0) * -80px), 0)" }}>
          <Link href="/life" className="mb-6 inline-flex w-fit items-center gap-1.5 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> {t("शालेय जीवन", "School life")}
          </Link>
          {date && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-300">
              <Calendar className="h-3.5 w-3.5" /> {date}
            </div>
          )}
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            {event.title}
          </h1>
        </div>
      </section>

      {event.description && (
        <Reveal className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <p className="whitespace-pre-line text-lg leading-relaxed text-ink-700">{event.description}</p>
        </Reveal>
      )}

      {/* Gallery — masonry via CSS columns so portrait and landscape both fit */}
      {event.photos.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
            {event.photos.map((p, i) => (
              <Reveal key={p.url} delay={(i % 4) * 80} className="mb-3 break-inside-avoid sm:mb-4">
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  className="group block w-full overflow-hidden rounded-2xl bg-ink-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
                  aria-label={p.caption || t(`फोटो ${i + 1}`, `Photo ${i + 1}`)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.caption ?? ""} loading="lazy"
                    className="w-full transition-transform duration-700 ease-out group-hover:scale-105" />
                </button>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {open != null && <Lightbox photos={event.photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
