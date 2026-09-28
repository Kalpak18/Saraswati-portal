"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";

/**
 * Full-bleed hero for the school home page.
 *
 * When a cover photo is set, it's the backdrop with a dark gradient overlay
 * that keeps text legible on any image. When it isn't, we render a
 * hand-tuned teal-to-brand gradient with a soft grid so the page never looks
 * empty — even on a first-install day when no admin has uploaded artwork.
 */
export default function HomeHero({
  data,
}: {
  data: {
    title: string;
    tagline: string;
    cover_photo_url: string | null;
    primary_cta_label: string;
    primary_cta_href: string;
    secondary_cta_label: string | null;
    secondary_cta_href: string | null;
    meta_line: string | null;
  };
}) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  const title = data.title.trim() || t(
    "उज्ज्वल भविष्याची पायाभरणी",
    "Where futures take shape",
  );
  const tagline = data.tagline.trim() || t(
    "गुणवत्तापूर्ण शिक्षण, संस्कारक्षम व्यक्तिमत्त्व — प्रत्येक विद्यार्थ्यासाठी.",
    "A place where academic rigour meets warmth, curiosity and care — for every child.",
  );

  return (
    <section className="relative isolate overflow-hidden">
      {/* Backdrop */}
      {data.cover_photo_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.cover_photo_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-brand-950/85 via-brand-900/70 to-brand-800/50" />
          <div className="absolute inset-0 bg-linear-to-t from-brand-950/60 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-to-br from-brand-800 via-brand-900 to-ink-900" />
          {/* Soft grid pattern */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 70%)",
            }}
          />
          {/* Warm accent glow */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        </>
      )}

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            {t("स्वागत आहे", "Welcome")}
          </div>

          <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {tagline}
          </p>

          {data.meta_line && (
            <p className="mt-4 text-sm font-medium tracking-wide text-accent-300">
              {data.meta_line}
            </p>
          )}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href={data.primary_cta_href}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 shadow-lg shadow-brand-950/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {data.primary_cta_label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {data.secondary_cta_label && data.secondary_cta_href ? (
              <Link
                href={data.secondary_cta_href}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {data.secondary_cta_label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/about"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {t("आमच्याबद्दल जाणून घ्या", "Learn about us")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-white" />
    </section>
  );
}
