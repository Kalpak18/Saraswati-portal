"use client";

import Link from "next/link";
import { Calendar, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { SectionHeader } from "../components/SectionHeader";

type Event = {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
  cover_photo_url: string | null;
  description: string;
};

export default function HomeEvents({ events }: { events: Event[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  return (
    <section className="border-y border-ink-100 bg-ink-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("शालेय जीवन", "School life")}
          title={t("नुकत्याच झालेल्या घडामोडी", "Recent events")}
          subtitle={t(
            "शाळेत काय चालू आहे — सांस्कृतिक कार्यक्रम, स्पर्धा, सहली आणि बरंच काही.",
            "What's been happening — festivals, competitions, field trips and everything in between.",
          )}
          action={{ href: "/life", label: t("सर्व पहा", "See all") }}
        />

        {events.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Calendar className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 font-display text-lg font-semibold text-ink-900">
              {t("आगामी कार्यक्रम लवकरच", "Upcoming events coming soon")}
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => (
              <Link
                key={e.id}
                href={`/life/${e.slug}`}
                className={`group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  i === 0 ? "md:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className={`w-full overflow-hidden bg-ink-100 ${i === 0 ? "aspect-16/9 lg:aspect-2/1" : "aspect-16/10"}`}>
                  {e.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.cover_photo_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-100 to-accent-100 text-brand-700">
                      <Calendar className="h-16 w-16 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-700">
                    <Calendar className="h-3 w-3" />
                    <span className="tabular-nums">{e.event_date ?? t("लवकरच", "Coming soon")}</span>
                  </div>
                  <h3 className={`mt-3 font-display font-semibold text-ink-900 group-hover:text-brand-800 ${i === 0 ? "text-2xl leading-tight" : "text-lg leading-tight"}`}>
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className={`mt-2 text-sm leading-relaxed text-ink-600 ${i === 0 ? "line-clamp-3" : "line-clamp-2"}`}>
                      {e.description}
                    </p>
                  )}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:text-brand-900">
                    {t("तपशील पहा", "View details")}
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
