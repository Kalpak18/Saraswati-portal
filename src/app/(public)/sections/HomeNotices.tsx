"use client";

import Link from "next/link";
import { ArrowRight, Paperclip, Pin } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { toMarathiDigits } from "@/lib/i18n/normalize";
import { isNew, noticeCategory, type PublicNotice } from "@/lib/notices";
import { cn } from "@/lib/utils";
import { EyebrowLabel } from "../components/EyebrowLabel";
import { Reveal } from "../components/motion";
import { useSectionDesign } from "../components/SectionDesign";
import { TITLE_SIZE } from "../components/SectionHeader";
import { pick, type HomeSection } from "@/lib/homeSections";

export function NoticeDate({ iso, lang }: { iso: string; lang: "mr" | "en" }) {
  const d = new Date(`${iso}T00:00:00`);
  const day = String(d.getDate());
  const month = d.toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", { month: "short" });
  return (
    <div className="flex w-14 flex-none flex-col items-center rounded-xl bg-white py-2 text-center shadow-sm ring-1 ring-ink-100">
      <span className="font-display text-2xl font-semibold leading-none text-ink-900">
        {lang === "mr" ? toMarathiDigits(day) : day}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">{month}</span>
    </div>
  );
}

/** Home page notice board: the latest few notices, pinned first. */
export default function HomeNotices({ notices, s }: { notices: PublicNotice[]; s: HomeSection }) {
  const { lang } = useLang();
  const design = useSectionDesign();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  if (notices.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-accent-50/60 to-white sec">
      <div className="sec-wrap grid grid-cols-1 gap-12 lg:grid-cols-12">
        <Reveal className={cn("lg:col-span-4", design.headingAlign === "center" && "text-center")}>
          {pick(s.content.eyebrow, lang) && <EyebrowLabel tone="accent">{pick(s.content.eyebrow, lang)}</EyebrowLabel>}
          <h2 className={cn("mt-3 font-display font-semibold leading-tight tracking-tight text-ink-900", TITLE_SIZE[design.headingSize ?? "md"])}>
            {pick(s.content.title, lang)}
          </h2>
          {pick(s.content.subtitle, lang) && <p className="mt-4 text-base text-ink-600">{pick(s.content.subtitle, lang)}</p>}
          <Link
            href="/notices"
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
          >
            {t("सर्व सूचना पहा", "View all notices")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Reveal>

        <ul className="space-y-3 lg:col-span-8">
          {notices.map((n, i) => {
            const cat = noticeCategory(n.category);
            return (
              <Reveal as="li" key={n.id} from="right" delay={i * 90}>
                <Link
                  href={`/notices#n-${n.id}`}
                  className={cn(
                    "group flex items-start gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5",
                    n.is_pinned ? "border-accent-200" : "border-ink-100",
                  )}
                >
                  <NoticeDate iso={n.publish_on} lang={lang} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${cat.tone}`}>
                        {cat[lang]}
                      </span>
                      {n.is_pinned && <Pin className="h-3.5 w-3.5 fill-accent-400 text-accent-500" aria-label={t("महत्त्वाचे", "Pinned")} />}
                      {isNew(n.publish_on) && (
                        <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">{t("नवीन", "New")}</span>
                      )}
                    </div>
                    <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug text-ink-900 group-hover:text-brand-800">
                      {n.title}
                    </h3>
                    {n.body && <p className="mt-1 line-clamp-2 text-sm text-ink-600">{n.body}</p>}
                    {n.attachment_url && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                        <Paperclip className="h-3.5 w-3.5" /> {t("जोडपत्र", "Attachment")}
                      </span>
                    )}
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 flex-none text-ink-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-700" />
                </Link>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
