import { type ReactNode } from "react";
import { EyebrowLabel } from "./EyebrowLabel";

/**
 * Interior-page hero. Smaller than the home hero and identical across pages
 * so navigation feels consistent.
 */
export function PageIntro({
  eyebrow, title, subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-ink-100 bg-linear-to-b from-brand-50/60 via-white to-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-24 top-4 h-72 w-72 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-accent-100/50 blur-3xl" />
      </div>
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        {eyebrow && <EyebrowLabel>{eyebrow}</EyebrowLabel>}
        <h1 className={`font-display text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl lg:text-6xl ${eyebrow ? "mt-4" : ""}`}>
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-base text-ink-600 sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
