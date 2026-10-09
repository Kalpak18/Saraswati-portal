import { ZodError } from "zod";

// Server actions report errors as values, not throws.
//
// In production, Next.js/React replaces the message of any error thrown
// from a server action with "Minified React error #441" — so "Message too
// short" or "Too many attempts" would reach people as gibberish. Every
// exported action therefore runs through `toResult`, and the browser side
// turns the result back into a normal throw with `clientAction`.

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function toResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    const message =
      err instanceof ZodError ? (err.issues[0]?.message ?? "Some details are missing or invalid")
      : err instanceof Error ? err.message
      : "Something went wrong, please try again";
    // Unexpected failures still reach the server log / Sentry.
    if (!(err instanceof ZodError)) console.error("[action]", err);
    return { ok: false, error: message };
  }
}
