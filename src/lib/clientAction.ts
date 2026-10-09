import type { ActionResult } from "./actionResult";

/**
 * Wraps a server action so callers can keep `await action(...)` with
 * try/catch: a failed result becomes a normal Error carrying the server's
 * real message (see actionResult.ts for why actions don't just throw).
 */
export function clientAction<A extends unknown[], T>(
  fn: (...args: A) => Promise<ActionResult<T>>,
): (...args: A) => Promise<T> {
  return async (...args: A) => {
    const r = await fn(...args);
    if (!r.ok) throw new Error(r.error);
    return r.data;
  };
}
