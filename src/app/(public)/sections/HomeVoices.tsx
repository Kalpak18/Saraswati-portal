"use client";

import { Quote } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { layoutOf, pick, type HomeSection, type SectionItem } from "@/lib/homeSections";
import { cn } from "@/lib/utils";
import { SectionHeader } from "../components/SectionHeader";
import { Reveal } from "../components/motion";
import { ItemLayout } from "../components/ItemLayout";

/**
 * Testimonials — admin-edited. One quote gets the whole stage; two or three
 * sit side by side; more become a swipeable row so the section never turns
 * into a wall of text.
 */
export default function HomeVoices({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  const items = s.items.filter((it) => pick(it.quote, lang));
  if (items.length === 0) return null;

  return (
    <section className="sec">
      <div className="sec-wrap">
        <Reveal>
          <SectionHeader eyebrow={pick(s.content.eyebrow, lang)} title={pick(s.content.title, lang)} align="center" />
        </Reveal>

        {layoutOf(s) !== "auto" ? (
          <ItemLayout layout={layoutOf(s) as "grid" | "carousel"} columns={s.config.columns} className="mt-14">
            {items.map((it, i) => <QuoteCard key={it.id} it={it} i={i} lang={lang} />)}
          </ItemLayout>
        ) : items.length === 1 ? (
          <Reveal className="mx-auto mt-14 max-w-3xl">
            <QuoteCard it={items[0]} i={0} lang={lang} large />
          </Reveal>
        ) : items.length <= 3 ? (
          <div className={cn("mt-14 grid grid-cols-1 gap-6", items.length === 2 ? "mx-auto max-w-5xl md:grid-cols-2" : "md:grid-cols-3")}>
            {items.map((it, i) => (
              <Reveal key={it.id} delay={i * 120} className="h-full"><QuoteCard it={it} i={i} lang={lang} /></Reveal>
            ))}
          </div>
        ) : (
          <div className="-mx-4 mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-4 scrollbar-none sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {items.map((it, i) => (
              <Reveal key={it.id} from="right" delay={Math.min(i, 3) * 100} className="w-[85vw] flex-none snap-start sm:w-[45vw] lg:w-[30vw]">
                <QuoteCard it={it} i={i} lang={lang} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function QuoteCard({ it, i, lang, large }: { it: SectionItem; i: number; lang: "mr" | "en"; large?: boolean }) {
  const accent = i % 2 === 1;
  const name = pick(it.name, lang);
  const role = pick(it.role, lang);
  return (
    <figure className={cn(
      "relative h-full overflow-hidden rounded-3xl p-8",
      accent
        ? "bg-linear-to-br from-accent-50 via-white to-accent-100 ring-1 ring-accent-200"
        : "bg-linear-to-br from-brand-50 via-white to-brand-100 ring-1 ring-brand-200",
      large && "p-10 text-center sm:p-14",
    )}>
      <Quote className={cn("absolute -right-3 -top-3 h-24 w-24", accent ? "text-accent-200" : "text-brand-200")} strokeWidth={1} />
      <blockquote className="relative">
        <p className={cn("font-display leading-relaxed text-ink-800", large ? "text-xl sm:text-2xl" : "text-base sm:text-lg")}>
          “{pick(it.quote, lang)}”
        </p>
      </blockquote>
      {(name || role) && (
        <figcaption className={cn("relative mt-6 flex items-center gap-3", large && "justify-center")}>
          {name && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white", accent ? "bg-accent-600" : "bg-brand-700")}>
              {name.trim().charAt(0)}
            </div>
          )}
          <div className={large ? "text-left" : undefined}>
            {name && <div className="text-sm font-semibold text-ink-900">{name}</div>}
            {role && <div className="text-xs text-ink-500">{role}</div>}
          </div>
        </figcaption>
      )}
    </figure>
  );
}
