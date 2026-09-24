"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Renders a `<label>` above the input, associated by `htmlFor`. */
  label?: ReactNode;
  /** Sub-label / helper text between the label and the input. */
  hint?: ReactNode;
  /** Inline error under the input. Also sets aria-invalid + red styling. */
  error?: ReactNode;
  /** Suffix / prefix visually grouped with the input. */
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  /** Show a red asterisk next to the label. Cosmetic only — still uses `required`. */
  required?: boolean;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, containerClassName, label, hint, error, leftAdornment, rightAdornment,
      id, required, ...props },
    ref,
  ) => {
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
          "block w-full rounded-md border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none",
          "placeholder:text-gray-400",
          "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
          hasError
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
          leftAdornment && "pl-9",
          rightAdornment && "pr-9",
          className,
        )}
        {...props}
      />
    );

    return (
      <div className={cn("flex flex-col gap-1", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-500">{hint}</p>
        )}
        {(leftAdornment || rightAdornment) ? (
          <div className="relative">
            {leftAdornment && (
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {leftAdornment}
              </span>
            )}
            {inputEl}
            {rightAdornment && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                {rightAdornment}
              </span>
            )}
          </div>
        ) : inputEl}
        {hasError && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
