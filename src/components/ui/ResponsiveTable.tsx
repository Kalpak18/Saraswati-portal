import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Admin tables that look natural on a laptop and readable on a phone.
 *
 * On >= sm: renders a real `<table>` with sticky header and rounded card.
 * On < sm : renders the same rows as vertical cards. The consumer builds the
 *          card body via the `mobileRow` render prop so we can present the
 *          most useful bits (name, primary status) at the top with secondary
 *          fields underneath — a horizontally-scrolled table never fits.
 *
 * Pattern:
 *
 *   <ResponsiveTable
 *     head={<><th>Roll</th><th>Name</th><th>Actions</th></>}
 *     rows={students.map((s) => ({
 *       key: s.id,
 *       cells: <><td>{s.roll_no}</td><td>{s.name}</td><td>…</td></>,
 *       mobile: <StudentMobileCard s={s} />,
 *     }))}
 *   />
 *
 * The `<td>` cells and the mobile card are independent — you can pack the
 * table row full of columns and keep the card focused.
 */

export type ResponsiveRow = {
  key: string;
  /** `<td>`s for the desktop table. */
  cells: ReactNode;
  /** Card body for the mobile view (< sm). */
  mobile: ReactNode;
};

export function ResponsiveTable({
  head,
  rows,
  empty,
  mobileEmpty,
  className,
}: {
  /** `<th>`s for the desktop table header. */
  head: ReactNode;
  rows: ResponsiveRow[];
  /** Rendered inside the empty desktop `<tbody>`. */
  empty?: ReactNode;
  /** Rendered when there are no rows on mobile. Falls back to `empty`. */
  mobileEmpty?: ReactNode;
  className?: string;
}) {
  const hasRows = rows.length > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>{head}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hasRows
                ? rows.map((r) => (
                    <tr key={r.key} className="hover:bg-gray-50">
                      {r.cells}
                    </tr>
                  ))
                : empty && (
                    <tr>
                      <td colSpan={99} className="px-4 py-12">
                        {empty}
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 sm:hidden">
        {hasRows
          ? rows.map((r) => (
              <div
                key={r.key}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {r.mobile}
              </div>
            ))
          : (mobileEmpty ?? empty) && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                {mobileEmpty ?? empty}
              </div>
            )}
      </div>
    </div>
  );
}
