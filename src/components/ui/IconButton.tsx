"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "gray" | "danger" | "indigo";

const tones: Record<Tone, string> = {
  gray:   "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
  danger: "text-red-500 hover:text-red-700 hover:bg-red-50",
  indigo: "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50",
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — icon-only buttons MUST have one. */
  label: string;
  tone?: Tone;
  size?: "sm" | "md";
  /** The icon. */
  children: ReactNode;
}

/**
 * Icon-only button with an enforced accessible name and touch-safe hit area.
 * On coarse pointers (phones) it stays 44×44 to hit Apple/WCAG touch-target
 * guidance; on fine pointers (mouse) it compacts to a comfortable 32×32.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, tone = "gray", size = "md", label, children, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        // Touch: 44×44 minimum. Desktop: comfortable 32×32.
        size === "md"
          ? "h-11 w-11 sm:h-9 sm:w-9 [@media(pointer:fine)]:h-9 [@media(pointer:fine)]:w-9"
          : "h-10 w-10 sm:h-8 sm:w-8 [@media(pointer:fine)]:h-8 [@media(pointer:fine)]:w-8",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = "IconButton";
