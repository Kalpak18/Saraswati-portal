import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Applied to every response. Student records are personal data, so the
// portal should not be embeddable, sniffable, or referrer-leaky.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Report cards must never be cached by a shared proxy — one parent
      // must not be served another child's card.
      {
        source: "/lookup/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

// Source maps upload only when the three build-time vars are present, so a
// deploy without them still succeeds (traces just point at minified lines).
const hasSentryUpload =
  !!process.env.SENTRY_AUTH_TOKEN && !!process.env.SENTRY_ORG && !!process.env.SENTRY_PROJECT;

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !hasSentryUpload },
  // Routes Sentry's own requests through our domain so ad blockers do not
  // swallow error reports from parents' phones.
  tunnelRoute: "/monitoring",
});
