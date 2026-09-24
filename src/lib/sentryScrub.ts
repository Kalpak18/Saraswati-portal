import type { ErrorEvent } from "@sentry/nextjs";

// Parents identify themselves with a mobile number and their child's date of
// birth. Neither may leave our infrastructure, so anything that looks like one
// is redacted before an event is sent — belt and braces on top of
// sendDefaultPii: false.
const MOBILE = /\b\d{6,15}\b/g;
const ISO_DATE = /\b\d{4}-\d{2}-\d{2}\b/g;

function redact(text: string) {
  return text.replace(MOBILE, "[redacted-number]").replace(ISO_DATE, "[redacted-date]");
}

export function scrubEvent(event: ErrorEvent): ErrorEvent | null {
  // Never ship request bodies — a server action payload holds the lookup itself.
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    if (event.request.url) event.request.url = redact(event.request.url);
    if (event.request.query_string) event.request.query_string = "[redacted]";
  }

  if (event.message) event.message = redact(event.message);

  for (const ex of event.exception?.values ?? []) {
    if (ex.value) ex.value = redact(ex.value);
  }

  for (const crumb of event.breadcrumbs ?? []) {
    if (crumb.message) crumb.message = redact(crumb.message);
    if (crumb.data?.url && typeof crumb.data.url === "string") {
      crumb.data.url = redact(crumb.data.url);
    }
  }

  return event;
}
