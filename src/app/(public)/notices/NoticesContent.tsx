"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Download, Megaphone, Pin } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { NOTICE_CATEGORIES, isNew, noticeCategory, type PublicNotice } from "@/lib/notices";
import { cn } from "@/lib/utils";
import { PageIntro } from "../components/PageIntro";
import { NoticeDate } from "../sections/HomeNotices";

export default function NoticesContent({ notices }: { notices: PublicNotice[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const [cat, setCat] = useState("");
  const [target, setTarget] = useState<string | null>(null);

  // Highlight the notice a ticker / home link pointed at (#n-<id>).
  useEffect(() => {
    const read = () => setTarget(window.location.hash.replace(/^#n-/, "") || null);
    const id = requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => { cancelAnimationFrame(id); window.removeEventListener("hashchange", read); };
  }, []);

  const cats = useMemo(() => NOTICE_CATEGORIES.filter((c) => notices.some((n) => n.category === c.key)), [notices]);
  const visible = notices.filter((n) => !cat || n.category === cat || n.id === target);

  return (
    <>
      <PageIntro
        eyebrow={t("सूचना फलक", "Notice board")}
        title={t("सूचना व घोषणा", "Notices & announcements")}
        subtitle={t(
          "प्रवेश, निकाल, परीक्षा आणि सुट्ट्यांविषयी शाळेच्या सर्व अधिकृत सूचना.",
          "Official updates from the school on admissions, results, exams and holidays.",
        )}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {cats.length > 1 && (
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[{ key: "", mr: "सर्व", en: "All" }, ...cats].map((c) => (
              <button key={c.key} onClick={() => setCat(c.key)} aria-pressed={cat === c.key}
                className={cn(
                  "flex-none rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-colors",
                  cat === c.key ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-brand-50",
                )}>
                {c[lang]}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">
              {t("सध्या कोणतीही सूचना नाही", "No notices right now")}
            </p>
          </div>
        ) : (
          <ol className="space-y-4">
            {visible.map((n) => {
              const c = noticeCategory(n.category);
              const external = n.link_href && /^https?:\/\//.test(n.link_href);
              return (
                <li
                  key={n.id}
                  id={`n-${n.id}`}
                  className={cn(
                    "scroll-mt-28 rounded-2xl border bg-white p-5 shadow-sm transition-shadow sm:p-6",
                    n.id === target ? "border-accent-300 ring-4 ring-accent-100" : n.is_pinned ? "border-accent-200" : "border-ink-100",
                  )}
                >
                  <div className="flex items-start gap-4">
                    <NoticeDate iso={n.publish_on} lang={lang} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${c.tone}`}>{c[lang]}</span>
                        {n.is_pinned && <Pin className="h-3.5 w-3.5 fill-accent-400 text-accent-500" aria-label={t("महत्त्वाचे", "Pinned")} />}
                        {isNew(n.publish_on) && (
                          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">{t("नवीन", "New")}</span>
                        )}
                      </div>
                      <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-ink-900 sm:text-2xl">{n.title}</h2>
                      {n.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-700 sm:text-base">{n.body}</p>}
                      {(n.attachment_url || n.link_href) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {n.attachment_url && (
                            <a href={n.attachment_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
                              <Download className="h-4 w-4" /> {n.attachment_name || t("सूचना डाउनलोड करा", "Download notice")}
                            </a>
                          )}
                          {n.link_href && (
                            <Link href={n.link_href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                              {t("अधिक माहिती", "More details")} <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
