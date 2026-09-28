import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * "Nothing here yet" state with a large icon, a title, a helper line and
 * optional call-to-action. Use in place of a bare "No X found" string on any
 * list surface — this is what the user actually reads first.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "mb-5 flex items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100",
            compact ? "h-12 w-12" : "h-16 w-16",
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className={cn("font-display font-semibold text-ink-900", compact ? "text-base" : "text-xl")}>
        {title}
      </h3>
      {description && (
        <p className={cn("mt-2 max-w-md text-ink-500", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
