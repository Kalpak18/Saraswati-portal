import { type ReactNode } from "react";

/**
 * Shared hero-lite banner for interior public pages (About, Events, Team, …).
 * Not a client component — no interactivity needed.
 */
export default function PageIntro({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <section className="border-b border-gray-200 bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:px-8">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
