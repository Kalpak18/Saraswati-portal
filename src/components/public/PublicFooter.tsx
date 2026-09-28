"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";

export function PublicFooter({
  school,
}: {
  school: { name: string | null; address: string | null; logo_url: string | null };
}) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const name = school.name || "Saraswati School";
  const year = new Date().getFullYear();

  const columns: { heading: string; links: { href: string; label: string }[] }[] = [
    {
      heading: t("शैक्षणिक", "Academics"),
      links: [
        { href: "/lookup",              label: t("परिणाम पहा", "Check Result") },
        { href: "/academics/toppers",   label: t("गुणवंत विद्यार्थी", "Toppers") },
        { href: "/academics/faculty",   label: t("शिक्षक वर्ग", "Faculty") },
        { href: "/academics/downloads", label: t("डाउनलोड", "Downloads") },
      ],
    },
    {
      heading: t("शाळा", "School"),
      links: [
        { href: "/about",   label: t("आमच्याबद्दल", "About us") },
        { href: "/life",    label: t("शालेय जीवन", "School life") },
        { href: "/contact", label: t("संपर्क", "Contact") },
      ],
    },
  ];

  return (
    <footer className="mt-24 bg-linear-to-b from-ink-900 to-brand-950 text-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand + tagline */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              {school.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={school.logo_url}
                  alt=""
                  className="h-10 w-10 flex-none rounded-lg bg-white p-1 object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/10 text-base font-bold text-white ring-1 ring-white/20">
                  {name.trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="font-display text-xl font-semibold text-white">{name}</div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
              {t(
                "प्रत्येक विद्यार्थ्याच्या सर्वांगीण विकासासाठी वचनबद्ध — दर्जेदार शिक्षणासोबतच मूल्यशिक्षण, कला आणि क्रीडांचा समतोल.",
                "Committed to the all-round development of every student — quality education balanced with values, arts and athletics.",
              )}
            </p>

            {school.address && (
              <div className="mt-6 flex items-start gap-3 text-sm text-ink-300">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-accent-400" />
                <span>{school.address}</span>
              </div>
            )}
            <div className="mt-2 flex items-start gap-3 text-sm text-ink-300">
              <Phone className="mt-0.5 h-4 w-4 flex-none text-accent-400" />
              <span>{t("फोन तपशील लवकरच", "Phone details coming soon")}</span>
            </div>
            <div className="mt-2 flex items-start gap-3 text-sm text-ink-300">
              <Mail className="mt-0.5 h-4 w-4 flex-none text-accent-400" />
              <Link href="/contact" className="hover:text-accent-300 hover:underline">
                {t("आम्हाला संदेश पाठवा", "Send us a message")}
              </Link>
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-accent-400">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-ink-300 transition-colors hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sub-footer */}
        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-ink-400 sm:flex-row sm:items-center">
          <p>© {year} {name}. {t("सर्व हक्क राखीव.", "All rights reserved.")}</p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-ink-300 hover:text-accent-300"
            >
              {t("प्रशासकीय प्रवेश", "Admin login")}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
