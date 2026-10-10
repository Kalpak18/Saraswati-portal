"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangContext";
import { EyebrowLabel } from "../components/EyebrowLabel";
import { useScrollProgress } from "../components/motion";
import { pick, type HomeSection } from "@/lib/homeSections";

/**
 * The school's promise, pinned to the middle of the screen while its words
 * light up one by one as the visitor scrolls — the story's first line.
 */
export default function HomeStatement({ s }: { s: HomeSection }) {
  const { lang } = useLang();
  const ref = useRef<HTMLElement>(null);
  useScrollProgress(ref, "pinned");

  const words = pick(s.content.body, lang).split(/\s+/).filter(Boolean);
  const eyebrow = pick(s.content.eyebrow, lang);
  const buttonLabel = pick(s.content.button_label, lang);
  const buttonHref = s.content.button_href || null;
  if (words.length === 0) return null;
  const n = words.length;

  return (
    <section ref={ref} className="relative h-[220svh] bg-white motion-reduce:h-auto">
      <div className="sticky top-0 flex h-svh items-center motion-reduce:static motion-reduce:h-auto motion-reduce:py-24">
        <div className="sec-wrap sec-wrap-5xl">
          {eyebrow && <EyebrowLabel>{eyebrow}</EyebrowLabel>}
          <p className="mt-6 font-display text-4xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            {words.map((w, i) => (
              <span
                key={i}
                className="transition-opacity duration-150"
                // Word i reaches full strength once --p passes (i + 1) / n.
                style={{ opacity: `clamp(0.12, calc(var(--p, 1) * ${n * 1.15} - ${i}), 1)` }}
              >
                {w}{" "}
              </span>
            ))}
          </p>
          {buttonLabel && buttonHref && (
            <div
              className="mt-10 flex flex-wrap items-center gap-4"
              style={{ opacity: "clamp(0, calc(var(--p, 1) * 4 - 3), 1)" }}
            >
              <Link
                href={buttonHref}
                className="group inline-flex items-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                {buttonLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
