"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  required?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, containerClassName, label, hint, error, leftAdornment, rightAdornment, id, required, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hasError = !!error;

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        required={required}
        className={cn(
          "block w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-xs outline-none transition-colors",
          "placeholder:text-ink-400",
          "disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500",
          hasError
            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100"
            : "border-ink-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-100",
          leftAdornment && "pl-10",
          rightAdornment && "pr-10",
          className,
        )}
        {...props}
      />
    );

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className="text-xs text-ink-500">{hint}</p>
        )}
        {(leftAdornment || rightAdornment) ? (
          <div className="relative">
            {leftAdornment && (
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink-400">
                {leftAdornment}
              </span>
            )}
            {inputEl}
            {rightAdornment && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-400">
                {rightAdornment}
              </span>
            )}
          </div>
        ) : inputEl}
        {hasError && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-red-600">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
