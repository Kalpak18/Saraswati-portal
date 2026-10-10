"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EyebrowLabel } from "./EyebrowLabel";
import { useSectionDesign } from "./SectionDesign";

export const TITLE_SIZE = {
  sm: "text-2xl sm:text-3xl",
  md: "text-3xl sm:text-4xl lg:text-5xl",
  lg: "text-4xl sm:text-5xl lg:text-6xl",
} as const;

/**
 * Consistent header for every mid-page section on the school site.
 * Eyebrow → display headline → optional "see all" link. The section's
 * Design panel can override the alignment and size.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  tone = "brand",
  align: alignProp = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  tone?: "brand" | "accent" | "muted";
  align?: "left" | "center";
}) {
  const design = useSectionDesign();
  const align = design.headingAlign ?? alignProp;
  const center = align === "center";
  if (!eyebrow && !title && !subtitle) return null;

  return (
    <div className={cn("flex flex-col gap-4", center ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between")}>
      <div className={cn("min-w-0", center && "flex flex-col items-center")}>
        {eyebrow && <EyebrowLabel tone={tone}>{eyebrow}</EyebrowLabel>}
        {title && (
          <h2 className={cn("mt-3 font-display font-semibold leading-tight tracking-tight text-ink-900", TITLE_SIZE[design.headingSize ?? "md"])}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={cn("mt-3 text-base text-ink-600 sm:max-w-2xl", center && "sm:mx-auto")}>
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex flex-none items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          {action.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
