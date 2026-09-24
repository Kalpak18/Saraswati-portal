import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentryScrub";

// Runs for the auth proxy in src/proxy.ts, which executes on the edge runtime.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "development",
  tracesSampleRate: 0.1,
  // v11 does not send PII by default; scrubEvent is the second line of defence.
  beforeSend: scrubEvent,
});
