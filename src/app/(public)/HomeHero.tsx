"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";

/**
 * The Home page hero. Admin-editable through /admin/website/hero — every
 * string that appears here is DB-driven with a sensible fallback so a
 * freshly-installed portal never looks broken.
 */
export default function HomeHero({
  data,
  studentsCount,
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
  studentsCount: number;
}) {
  const { lang } = useLang();

  const fallbackTitle = lang === "mr"
    ? "उत्कृष्ट शिक्षण, उज्ज्वल भविष्य"
    : "Excellence in education, brighter futures";
  const fallbackTagline = lang === "mr"
    ? "आपल्या मुलांच्या सर्वांगीण विकासासाठी वचनबद्ध."
    : "Committed to the all-round development of every child.";

  const title = data.title.trim() || fallbackTitle;
  const tagline = data.tagline.trim() || fallbackTagline;

  return (
    <section className="relative overflow-hidden">
      {/* Background — cover photo if present, else a soft indigo gradient. */}
      {data.cover_photo_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.cover_photo_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-br from-black/70 via-indigo-900/60 to-indigo-700/50" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800" />
          {/* Decorative gradient blobs. */}
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        </>
      )}

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur ring-1 ring-white/20">
            <Sparkles className="h-3 w-3" />
            {lang === "mr" ? "स्वागत आहे" : "Welcome"}
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-indigo-50 sm:text-lg">
            {tagline}
          </p>

          {data.meta_line && (
            <p className="mt-3 text-sm text-indigo-100/80">{data.meta_line}</p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={data.primary_cta_href}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {data.primary_cta_label}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {data.secondary_cta_label && data.secondary_cta_href && (
              <Link
                href={data.secondary_cta_href}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/20"
              >
                {data.secondary_cta_label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid max-w-2xl grid-cols-2 gap-4 border-t border-white/20 pt-8 sm:grid-cols-3 sm:gap-6">
          <div>
            <div className="text-3xl font-bold tabular-nums">{studentsCount || "—"}</div>
            <div className="mt-1 text-xs text-indigo-100/80">
              {lang === "mr" ? "विद्यार्थी" : "Students"}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-amber-300" />
              <div className="text-3xl font-bold">
                {lang === "mr" ? "SSC" : "SSC"}
              </div>
            </div>
            <div className="mt-1 text-xs text-indigo-100/80">
              {lang === "mr" ? "मान्यताप्राप्त" : "Board affiliated"}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="text-3xl font-bold">
              {lang === "mr" ? "मराठी + इंग्रजी" : "MR + EN"}
            </div>
            <div className="mt-1 text-xs text-indigo-100/80">
              {lang === "mr" ? "द्विभाषिक शिक्षण" : "Bilingual education"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
