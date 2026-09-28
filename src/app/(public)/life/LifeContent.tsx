"use client";

import Link from "next/link";
import { Calendar, Camera, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { PageIntro } from "../components/PageIntro";
import { SectionHeader } from "../components/SectionHeader";

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string | null;
  cover_photo_url: string | null;
};
type Album = {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_photo_url: string | null;
  display_order: number;
};

export default function LifeContent({ events, albums }: { events: Event[]; albums: Album[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);

  return (
    <>
      <PageIntro
        eyebrow={t("शालेय जीवन", "School life")}
        title={t("वर्गापलीकडचं शिक्षण.", "Learning that goes beyond the classroom.")}
        subtitle={t(
          "कार्यक्रम, स्पर्धा, सहली, आणि सांस्कृतिक क्षण — इथेच खरं शिक्षण घडतं.",
          "Events, competitions, field trips and cultural moments — where the real learning happens.",
        )}
      />

      {/* Events */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("कार्यक्रम", "Events")}
          title={t("आठवडा-दर-आठवडा घडणारं शिक्षण", "Week by week, moment by moment")}
        />
        {events.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Calendar className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 font-display text-lg font-semibold text-ink-900">
              {t("आगामी कार्यक्रम लवकरच", "Upcoming events coming soon")}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/life/${e.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-16/10 w-full overflow-hidden bg-ink-100">
                  {e.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={e.cover_photo_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-100 to-accent-100 text-brand-700">
                      <Calendar className="h-14 w-14 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-brand-700">
                    <Calendar className="h-3 w-3" />
                    <span className="tabular-nums">{e.event_date ?? t("लवकरच", "Coming soon")}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-tight text-ink-900 group-hover:text-brand-800">
                    {e.title}
                  </h3>
                  {e.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-ink-600">{e.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Galleries */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={t("गॅलरी", "Gallery")}
          title={t("क्षणचित्रं", "Snapshots from around campus")}
        />
        {albums.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Camera className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 font-display text-lg font-semibold text-ink-900">
              {t("फोटो अल्बम लवकरच", "Photo albums coming soon")}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a) => (
              <Link
                key={a.id}
                href={`/life/gallery/${a.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink-100 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="aspect-4/3 w-full overflow-hidden bg-ink-100">
                  {a.cover_photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={a.cover_photo_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-accent-100 to-brand-100 text-brand-700">
                      <Camera className="h-14 w-14 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-1 font-display text-lg font-semibold text-ink-900 group-hover:text-brand-800">
                    {a.title}
                  </h3>
                  {a.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-ink-600">{a.description}</p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    {t("अल्बम पहा", "View album")}
                    <ArrowUpRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
