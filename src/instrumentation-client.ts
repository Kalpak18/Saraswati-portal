import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "@/lib/sentryScrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? "production",
  tracesSampleRate: 0.1,
  // Session replay is off: it would record parents typing a mobile number
  // and a child's date of birth.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // v11 does not send PII by default; scrubEvent is the second line of defence.
  beforeSend: scrubEvent,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
