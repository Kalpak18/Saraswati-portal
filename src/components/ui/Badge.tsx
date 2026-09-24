import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone =
  | "gray" | "indigo" | "green" | "amber" | "red" | "blue" | "purple";

const tones: Record<Tone, string> = {
  gray:   "bg-gray-100 text-gray-700",
  indigo: "bg-indigo-50 text-indigo-700",
  green:  "bg-green-50 text-green-700",
  amber:  "bg-amber-50 text-amber-700",
  red:    "bg-red-50 text-red-700",
  blue:   "bg-blue-50 text-blue-700",
  purple: "bg-purple-50 text-purple-700",
};

/**
 * Small coloured pill for status / category labels. Prefer to a raw
 * `<span className="rounded-full …">` — keeps colours consistent.
 */
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
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
