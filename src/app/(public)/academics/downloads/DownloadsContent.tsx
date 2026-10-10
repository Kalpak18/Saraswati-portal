"use client";

import { Download, FileText } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { DOWNLOAD_CATEGORIES, fileMeta, type DownloadItem } from "@/lib/downloads";
import { PageIntro } from "../../components/PageIntro";
import { Reveal } from "../../components/motion";

export default function DownloadsContent({ items }: { items: DownloadItem[] }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const groups = DOWNLOAD_CATEGORIES.map((c) => ({ ...c, rows: items.filter((i) => i.category === c.key) })).filter((g) => g.rows.length);

  return (
    <>
      <PageIntro
        eyebrow={t("शैक्षणिक", "Academics")}
        title={t("डाउनलोड", "Downloads")}
        subtitle={t(
          "शैक्षणिक दिनदर्शिका, अर्ज, परिपत्रके आणि इतर महत्त्वाची कागदपत्रे.",
          "School calendar, forms, circulars and other important documents.",
        )}
      />
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <FileText className="mx-auto h-12 w-12 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">
              {t("सध्या कोणतीही कागदपत्रे नाहीत", "No documents right now")}
            </p>
            <p className="mt-2 text-sm text-ink-500">
              {t("आवश्यक कागदपत्रांसाठी शाळेच्या कार्यालयाशी संपर्क साधा.", "Please contact the school office for any document you need.")}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((g) => (
              <section key={g.key}>
                <h2 className="mb-4 font-display text-2xl font-semibold text-ink-900">{g[lang]}</h2>
                <ul className="space-y-3">
                  {g.rows.map((d, i) => (
                    <Reveal as="li" key={d.id} delay={i * 60}>
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" download={d.file_name ?? undefined}
                        className="group flex items-center gap-4 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink-900 group-hover:text-brand-800">
                            {lang === "mr" && d.title_mr ? d.title_mr : d.title}
                          </div>
                          <div className="text-xs text-ink-500">{[d.description, fileMeta(d.file_name, d.file_size)].filter(Boolean).join(" · ")}</div>
                        </div>
                        <span className="inline-flex flex-none items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white group-hover:bg-brand-800">
                          <Download className="h-4 w-4" /> <span className="hidden sm:inline">{t("डाउनलोड", "Download")}</span>
                        </span>
                      </a>
                    </Reveal>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
