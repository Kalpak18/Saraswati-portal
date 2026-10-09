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

/** Records one attempt under `key`; returns attempts in the window, or null if the limiter is unavailable. */
async function record(key: string, windowSeconds: number): Promise<number | null> {
  try {
    const { data, error } = await createSupabaseAdmin().rpc("record_lookup_attempt", {
      p_ip_hash: key,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.warn("[rateLimit] unavailable:", error.message);
      return null;
    }
    return typeof data === "number" ? data : null;
  } catch (err) {
    console.warn("[rateLimit] skipped:", (err as Error).message);
    return null;
  }
}

/**
 * Two budgets, checked together:
 *  - per network (IP): generous, because on result day many parents share
 *    one carrier / school Wi-Fi address;
 *  - per mobile number, over 24 h from any network: strict, because mobile +
 *    date of birth is the secret and DOBs are guessable.
 * Throws RateLimitError when either is spent.
 *
 * Fails open: if the limiter itself errors (migration not applied,
 * database blip) the lookup still works. Availability for parents beats
 * a hard failure, and the attempt is logged either way.
 */
export async function enforceLookupRateLimit(mobileDigits: string) {
  const ipKey = await clientFingerprint();
  const mobileKey = "m:" + createHash("sha256").update(`${mobileDigits}:${env.IP_HASH_SALT}`).digest("hex");
  const [byIp, byMobile] = await Promise.all([
    record(ipKey, env.LOOKUP_RATE_WINDOW_SECONDS),
    record(mobileKey, 24 * 60 * 60),
  ]);
  if ((byIp ?? 0) > env.LOOKUP_RATE_LIMIT || (byMobile ?? 0) > env.LOOKUP_MOBILE_LIMIT) {
    throw new RateLimitError();
  }
}
