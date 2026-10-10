import { createSupabaseAdmin } from "@/lib/supabase/admin";

// Called once a day by Vercel Cron (vercel.json). Supabase's free plan
// pauses a project after 7 days without database activity — e.g. over the
// summer holidays — which would take the whole site and results offline.
// One tiny query a day keeps it awake. Also usable by an uptime monitor.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { error } = await createSupabaseAdmin().from("school_settings").select("id").limit(1);
  if (error) {
    console.error("[keepalive] database unreachable:", error.message);
    return Response.json({ ok: false }, { status: 503 });
  }
  return Response.json({ ok: true, at: new Date().toISOString() });
}
