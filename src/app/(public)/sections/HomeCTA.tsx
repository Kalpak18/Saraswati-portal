"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { pick, type HomeSection } from "@/lib/homeSections";
import { Reveal } from "../components/motion";

/**
 * Bold coloured band with one invitation — admin-edited. The address and
 * phone line underneath come from Settings.
 */
export default function HomeCTA({
  s, address, mapUrl, phone,
}: { s: HomeSection; address: string; mapUrl: string; phone: string | null }) {
  const { lang } = useLang();
  const t = (mr: string, en: string) => (lang === "mr" ? mr : en);
  const eyebrow = pick(s.content.eyebrow, lang);
  const title = pick(s.content.title, lang);
  const body = pick(s.content.body, lang);
  const label = pick(s.content.button_label, lang);
  const href = s.content.button_href || null;
  if (!title && !body) return null;

  return (
    <section className="relative overflow-hidden sec">
      {/* Backdrop */}
      <div className="sec-backdrop absolute inset-0 -z-10 bg-linear-to-br from-brand-800 via-brand-900 to-ink-900" />
      <div className="sec-backdrop absolute inset-0 -z-10 opacity-30"
           style={{
             backgroundImage:
               "radial-gradient(circle at 20% 30%, rgba(251,191,36,0.3), transparent 40%), radial-gradient(circle at 80% 70%, rgba(20,184,166,0.3), transparent 40%)",
           }}
      />

      <Reveal className="sec-wrap sec-wrap-5xl text-center text-white">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            {eyebrow}
          </div>
        )}

        {title && (
          <h2 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{title}</h2>
        )}
        {body && <p className="mx-auto mt-5 max-w-2xl text-base text-white/85 sm:text-lg">{body}</p>}

        {label && href && (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={href}
              {...(/^https?:\/\//.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-brand-800 shadow-lg shadow-brand-950/30 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        )}

        {/* Contact line from Settings */}
        <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center justify-center gap-4 border-t border-white/10 pt-8 text-xs text-white/70 sm:flex-row sm:gap-8">
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-start gap-2 text-left hover:text-white hover:underline">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-accent-400" />
            <span>{address} · {t("दिशा मिळवा", "Get directions")}</span>
          </a>
          {phone && (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 hover:text-white hover:underline">
              <Phone className="h-3.5 w-3.5 text-accent-400" />
              <span className="tabular-nums">{phone}</span>
            </a>
          )}
        </div>
      </Reveal>
    </section>
  );
}
