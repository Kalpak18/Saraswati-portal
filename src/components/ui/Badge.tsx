import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "gray" | "brand" | "accent" | "green" | "amber" | "red" | "blue" | "purple";

const tones: Record<Tone, string> = {
  gray:   "bg-ink-100 text-ink-700 ring-ink-200",
  brand:  "bg-brand-50 text-brand-800 ring-brand-200",
  accent: "bg-accent-50 text-accent-700 ring-accent-200",
  green:  "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber:  "bg-accent-50 text-accent-700 ring-accent-200",
  red:    "bg-red-50 text-red-700 ring-red-200",
  blue:   "bg-blue-50 text-blue-700 ring-blue-200",
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
