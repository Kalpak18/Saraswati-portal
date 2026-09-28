import { type ReactNode } from "react";

/**
 * The small uppercase strip above every section title. Kept small on purpose
 * so it introduces content without competing with the headline for attention.
 */
export function EyebrowLabel({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "accent" | "muted";
}) {
  const tones = {
    brand:  "text-brand-700",
    accent: "text-accent-600",
    muted:  "text-ink-500",
  } as const;
  return (
    <div className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest ${tones[tone]}`}>
      <span className="h-px w-6 bg-current" />
      {children}
    </div>
  );
}
