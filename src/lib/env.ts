import { z } from "zod";

// Fails fast at boot with a readable message instead of a stray
// "supabaseUrl is required" thrown from deep inside a request.
// Server-only: never import this from a client component.
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("must be https://<ref>.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "looks too short to be a key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "looks too short to be a key"),
  /** Max parent lookups allowed from one IP inside the window. */
  LOOKUP_RATE_LIMIT: z.coerce.number().int().positive().default(30),
  LOOKUP_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  /** Salt for hashing IPs, so no raw IP is ever stored. */
  IP_HASH_SALT: z.string().min(8).default("saraswati-portal-dev-salt"),
  /** Optional: error monitoring. Absent = monitoring simply off. */
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  LOOKUP_RATE_LIMIT: process.env.LOOKUP_RATE_LIMIT,
  LOOKUP_RATE_WINDOW_SECONDS: process.env.LOOKUP_RATE_WINDOW_SECONDS,
  IP_HASH_SALT: process.env.IP_HASH_SALT,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`);
  throw new Error(
    `Environment is not configured.\n${lines.join("\n")}\n\n` +
      `Copy .env.local.example to .env.local and fill it in (local), ` +
      `or set these in your host's environment settings (production).`,
  );
}

export const env = parsed.data;
