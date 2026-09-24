import { type ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Crumb = { label: ReactNode; href?: string };

/**
 * Standard page header with a breadcrumb, title, optional description and a
 * right-aligned actions slot. Every admin route uses this at the top.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1 flex flex-wrap items-center text-xs text-gray-500">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <ChevronRight className="mx-1 h-3 w-3 text-gray-400" aria-hidden="true" />}
                {c.href ? (
                  <Link href={c.href} className="rounded hover:text-indigo-600 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-gray-700" aria-current="page">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
