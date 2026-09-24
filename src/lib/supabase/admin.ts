import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Service-role client. Server-only. Never import from a client component.
export function createSupabaseAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
