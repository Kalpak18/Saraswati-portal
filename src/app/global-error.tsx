"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Last-resort boundary: catches errors thrown in the root layout itself,
// where the normal error.tsx no longer has a shell to render into.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="mr">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>तांत्रिक अडचण आली</h1>
        <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
          The application failed to load. Please try again.
        </p>
        {error.digest && (
          <p style={{ color: "#9ca3af", fontSize: "0.75rem", fontFamily: "monospace" }}>
            ref: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem", padding: "0.5rem 1.25rem", borderRadius: "0.375rem",
            background: "#4f46e5", color: "#fff", border: 0, cursor: "pointer",
          }}
        >
          पुन्हा प्रयत्न करा · Try again
        </button>
      </body>
    </html>
  );
}
