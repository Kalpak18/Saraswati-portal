import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-lg font-semibold text-gray-900">पान सापडले नाही</h1>
        <p className="mt-1 text-sm text-gray-500">
          This page does not exist, or the result is no longer available.
        </p>
        <Link
          href="/lookup"
          className="mt-6 inline-flex h-10 items-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
        >
          परिणाम पहा · View Result
        </Link>
      </div>
    </div>
  );
}
