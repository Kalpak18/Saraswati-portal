import Link from "next/link";
import { SearchX, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <SearchX className="h-7 w-7" />
        </div>
        <p className="mb-1 text-4xl font-bold text-ink-900">404</p>
        <h1 className="text-lg font-semibold text-ink-900">
          पान सापडले नाही · Page not found
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          The page you&apos;re looking for doesn&apos;t exist, or the result is no longer available.
        </p>
        <Link
          href="/lookup"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-brand-700 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <Home className="h-4 w-4" />
          मुख्यपृष्ठ · Go home
        </Link>
      </div>
    </div>
  );
}
