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
    <header className={cn("mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 flex-1">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center text-[11px] font-medium uppercase tracking-widest text-ink-500">
            {breadcrumbs.map((c, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <ChevronRight className="mx-1.5 h-3 w-3 text-ink-300" aria-hidden="true" />}
                {c.href ? (
                  <Link href={c.href} className="rounded hover:text-brand-700 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink-800" aria-current="page">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-sm text-ink-600 sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
