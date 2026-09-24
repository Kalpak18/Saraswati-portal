import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { env } from "./env";
import { createSupabaseAdmin } from "./supabase/admin";

/** Hashed client IP — we never store or log the raw address. */
export async function clientFingerprint() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(`${ip}:${env.IP_HASH_SALT}`).digest("hex");
}

export class RateLimitError extends Error {
  constructor() {
    super("RATE_LIMITED");
    this.name = "RateLimitError";
  }
}

/**
 * Counts this IP's recent attempts and records the current one.
 * Throws RateLimitError once the window budget is spent.
 *
 * Fails open: if the limiter itself errors (migration not applied,
 * database blip) the lookup still works. Availability for parents beats
 * a hard failure, and the attempt is logged either way.
 */
export async function enforceLookupRateLimit() {
  const ipHash = await clientFingerprint();
  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin.rpc("record_lookup_attempt", {
      p_ip_hash: ipHash,
      p_window_seconds: env.LOOKUP_RATE_WINDOW_SECONDS,
    });
    if (error) {
      console.warn("[rateLimit] unavailable:", error.message);
      return;
    }
    if (typeof data === "number" && data > env.LOOKUP_RATE_LIMIT) {
      throw new RateLimitError();
    }
  } catch (err) {
    if (err instanceof RateLimitError) throw err;
    console.warn("[rateLimit] skipped:", (err as Error).message);
  }
}
