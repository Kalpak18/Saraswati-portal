"use client";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 shadow-sm",
  secondary:
    "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 shadow-sm",
  outline:
    "bg-transparent text-indigo-700 border border-indigo-300 hover:bg-indigo-50 active:bg-indigo-100",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-300 shadow-sm",
};

const sizes: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-9 w-9 p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /**
   * Show a spinner in place of the button label and disable the click.
   * Use for any button that triggers a server action so users see feedback
   * within the same frame instead of clicking twice.
   */
  loading?: boolean;
  /** Optional leading icon (renders before children). Ignored while loading. */
  leftIcon?: ReactNode;
  /** Optional trailing icon. Ignored while loading. */
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className, variant = "primary", size = "md",
      loading = false, leftIcon, rightIcon, disabled, children, type, ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-md font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : leftIcon}
      {size !== "icon" && children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = "Button";
