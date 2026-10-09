"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { isNew, noticeCategory, type PublicNotice } from "@/lib/notices";
import { pick, type Bi } from "@/lib/homeSections";

/**
 * "Latest updates" strip under the hero — the notice-board ticker parents
 * expect on a school site. Scrolls continuously, pauses on hover/focus,
 * and sits still (scrollable by hand) when reduced motion is on.
 */
export function NoticeTicker({ notices, label }: { notices: PublicNotice[]; label?: Bi }) {
  const { lang } = useLang();
  if (notices.length === 0) return null;
  const heading = pick(label, lang) || (lang === "mr" ? "ताज्या सूचना" : "Latest updates");

  const items = notices.map((n) => {
    const cat = noticeCategory(n.category);
    return (
      <Link
        key={n.id}
        href={`/notices#n-${n.id}`}
        className="inline-flex flex-none items-center gap-2 px-6 text-sm text-ink-800 hover:text-brand-800 focus-visible:underline focus-visible:outline-none"
      >
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${cat.tone}`}>
          {cat[lang]}
        </span>
        <span className="font-medium">{n.title}</span>
        {isNew(n.publish_on) && (
          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
            {lang === "mr" ? "नवीन" : "New"}
          </span>
        )}
        <span className="text-ink-300" aria-hidden="true">•</span>
      </Link>
    );
  });

  return (
    <section aria-label={heading} className="relative z-10 border-b border-accent-200 bg-accent-50">
      <div className="mx-auto flex max-w-7xl items-stretch">
        <Link
          href="/notices"
          className="flex flex-none items-center gap-2 bg-accent-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-accent-600 sm:px-5"
        >
          <Megaphone className="h-4 w-4" />
          <span className="hidden sm:inline">{heading}</span>
        </Link>
        <div className="group relative flex-1 overflow-hidden motion-reduce:overflow-x-auto">
          {/* Two copies back to back so the loop is seamless at -50%. */}
          <div className="marquee flex w-max items-center py-3 group-focus-within:[animation-play-state:paused]">
            {items}
            <div aria-hidden="true" className="flex items-center">{items}</div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-accent-50 to-transparent" />
        </div>
      </div>
    </section>
  );
}
