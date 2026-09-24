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
            "mb-4 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-500",
            compact ? "h-10 w-10" : "h-14 w-14",
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3 className={cn("font-semibold text-gray-900", compact ? "text-sm" : "text-base")}>
        {title}
      </h3>
      {description && (
        <p className={cn("mt-1 max-w-md text-gray-500", compact ? "text-xs" : "text-sm")}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
