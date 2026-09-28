"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EyebrowLabel } from "./EyebrowLabel";

/**
 * Consistent header for every mid-page section on the school site.
 * Eyebrow → display headline → optional right-aligned "see all" link.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
  tone = "brand",
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
  tone?: "brand" | "accent" | "muted";
  align?: "left" | "center";
}) {
  const alignCls = align === "center" ? "text-center items-center" : "";
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${align === "center" ? "sm:flex-col" : ""}`}>
      <div className={`min-w-0 ${alignCls}`}>
        <EyebrowLabel tone={tone}>{eyebrow}</EyebrowLabel>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-3 text-base text-ink-600 sm:max-w-2xl ${align === "center" ? "sm:mx-auto" : ""}`}>
            {subtitle}
          </p>
        )}
      </div>
      {action && align !== "center" && (
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
