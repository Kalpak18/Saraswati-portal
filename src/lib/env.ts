import { z } from "zod";

// Fails fast at boot with a readable message instead of a stray
// "supabaseUrl is required" thrown from deep inside a request.
// Server-only: never import this from a client component.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("must be https://<ref>.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "looks too short to be a key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "looks too short to be a key"),
  /** Max parent lookups from one network (IP) inside the window. Generous:
   *  on result day hundreds of parents share one Jio / Airtel / school Wi-Fi IP. */
  LOOKUP_RATE_LIMIT: z.coerce.number().int().positive().default(300),
  LOOKUP_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  /** Max lookups for one mobile number per 24 h, from anywhere. Strict: this
   *  is what stops someone guessing a child's date of birth. */
  LOOKUP_MOBILE_LIMIT: z.coerce.number().int().positive().default(20),
  /** Salt for hashing IPs, so no raw IP is ever stored. */
  IP_HASH_SALT: z.string().min(8).default("saraswati-portal-dev-salt"),
  /** Optional: error monitoring. Absent = monitoring simply off. */
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  /** Public address of the site, for sitemap / link previews (e.g. https://saraswatividyalaya.in). */
  NEXT_PUBLIC_SITE_URL: z.string().url("must be a full https:// address").optional().or(z.literal("")),
});

const DEV_SALT = "saraswati-portal-dev-salt";

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  LOOKUP_RATE_LIMIT: process.env.LOOKUP_RATE_LIMIT,
  LOOKUP_RATE_WINDOW_SECONDS: process.env.LOOKUP_RATE_WINDOW_SECONDS,
  LOOKUP_MOBILE_LIMIT: process.env.LOOKUP_MOBILE_LIMIT,
  IP_HASH_SALT: process.env.IP_HASH_SALT,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

// The IP salt is a secret: with the public default, stored visitor hashes
// could be reversed by trying every IP. Refuse to serve production without
// a real one (the build step itself is allowed through).
if (
  parsed.success &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build" &&
  parsed.data.IP_HASH_SALT === DEV_SALT
) {
  throw new Error(
    "Environment is not configured.\n  • IP_HASH_SALT: set a long random value in production " +
      "(e.g. the output of `openssl rand -hex 32`).",
  );
}

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`);
  throw new Error(
    `Environment is not configured.\n${lines.join("\n")}\n\n` +
      `Copy .env.local.example to .env.local and fill it in (local), ` +
      `or set these in your host's environment settings (production).`,
  );
}

export const env = parsed.data;
