import { Download, FileText } from "lucide-react";
import { PageIntro } from "../../components/PageIntro";

export const metadata = { title: "Downloads" };

/**
 * Static placeholder for now. When the admin uploads real documents through
 * a future /admin/website/downloads editor, this page will iterate over them.
 */
export default function DownloadsPage() {
  const items: { title: string; description: string }[] = [];

  return (
    <>
      <PageIntro
        eyebrow="Academics"
        title="Downloads"
        subtitle="School calendar, forms, circulars and other important documents."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-14 text-center">
            <FileText className="mx-auto h-12 w-12 text-ink-300" />
            <p className="mt-4 font-display text-xl font-semibold text-ink-900">
              Documents will appear here soon
            </p>
            <p className="mt-2 text-sm text-ink-500">
              Admin can upload PDFs, notices and forms from the website content section.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.title} className="flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Download className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink-900">{it.title}</div>
                  <div className="text-xs text-ink-500">{it.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
