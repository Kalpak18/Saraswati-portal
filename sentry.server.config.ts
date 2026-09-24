import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentryScrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? "development",
  // 10% of transactions is plenty for a school-sized portal and stays inside
  // the free plan's quota. Raise it while investigating something.
  tracesSampleRate: 0.1,
  // v11 does not send PII by default; scrubEvent is the second line of defence.
  beforeSend: scrubEvent,
});
