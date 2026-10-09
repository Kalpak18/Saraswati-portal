import Link from "next/link";
import { EyeOff, Plus } from "lucide-react";

/**
 * Shown ONLY to a signed-in admin viewing the public site, in place of a
 * section that has nothing to show yet — so "my section isn't on the site"
 * explains itself. Visitors never see this.
 */
export function AdminEmptyNotice({
  label, reason, action,
}: { label: string; reason: string; action: { href: string; label: string } }) {
  return (
    <div className="sec-wrap py-6">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-5 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <EyeOff className="mt-0.5 h-4 w-4 flex-none" />
          <div>
            <div className="font-semibold">“{label}” is hidden from visitors</div>
            <div className="mt-0.5 text-amber-800">{reason} Only admins see this box.</div>
          </div>
        </div>
        <Link href={action.href}
          className="inline-flex flex-none items-center justify-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700">
          <Plus className="h-3.5 w-3.5" /> {action.label}
        </Link>
      </div>
    </div>
  );
}
