"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Every button in the app. Keeps the visual language consistent — teal
 * primary, warm-tinted ghosts and secondaries, a proper focus ring keyed to
 * the brand palette. `loading` shows a spinner in place of the label and
 * disables the click so the same click can't fire twice.
 */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "accent";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-300 shadow-sm shadow-brand-950/10",
  secondary:
    "bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 active:bg-ink-100 disabled:bg-ink-50 disabled:text-ink-400 disabled:border-ink-200 shadow-sm",
  outline:
    "bg-transparent text-brand-800 border border-brand-300 hover:bg-brand-50 active:bg-brand-100",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 active:bg-ink-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 shadow-sm",
  accent:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 disabled:bg-accent-300 shadow-sm",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1 rounded-md",
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-md",
  md: "h-11 px-5 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2 rounded-lg",
  icon: "h-10 w-10 p-0 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the click while pending. */
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, leftIcon, rightIcon, disabled, children, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
      {size !== "icon" && children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = "Button";
