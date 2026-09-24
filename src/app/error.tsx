"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    Sentry.captureException(error);
    console.error("[app] unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertOctagon className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          तांत्रिक अडचण आली
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Something went wrong. It has been reported — please try again.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-gray-400">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse justify-center gap-2 sm:flex-row">
          <Button variant="secondary" onClick={() => router.push("/lookup")} leftIcon={<Home className="h-4 w-4" />}>
            मुख्यपृष्ठ · Home
          </Button>
          <Button onClick={reset} leftIcon={<RefreshCw className="h-4 w-4" />}>
            पुन्हा प्रयत्न करा · Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
