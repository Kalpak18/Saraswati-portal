import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Landing point for Supabase email links (password recovery).
 * Exchanges the one-time code for a session, then sends the user on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    // Expired or already-used link.
    return NextResponse.redirect(`${origin}/forgot-password?expired=1`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] code exchange failed:", error.message);
    return NextResponse.redirect(`${origin}/forgot-password?expired=1`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
