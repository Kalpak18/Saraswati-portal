"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <h1 className="text-lg font-semibold text-gray-900">तांत्रिक अडचण आली</h1>
        <p className="mt-1 text-sm text-gray-500">
          Something went wrong. Please try again.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-gray-400">ref: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>पुन्हा प्रयत्न करा · Try again</Button>
          <Button variant="secondary" onClick={() => router.push("/lookup")}>
            मुख्यपृष्ठ · Home
          </Button>
        </div>
      </div>
    </div>
  );
}
