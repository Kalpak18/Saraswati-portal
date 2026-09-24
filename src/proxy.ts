import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() refreshes an expired access token and writes the rotated tokens
  // into `response` via setAll above. Any response we return INSTEAD of it must
  // carry those cookies, or the browser keeps a refresh token the server has
  // already rotated away — and the admin is silently logged out mid-session.
  function redirectTo(pathname: string, next?: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isLoginRoute = path === "/login";

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // Auth service unreachable. Do not throw: that would 500 every page,
    // including the parent lookup, which needs no session at all.
    console.error("[proxy] session check failed:", (err as Error).message);
    // Fail closed for the admin area, open for everything else.
    if (isAdminRoute) return redirectTo("/login", path);
    return response;
  }

  if (isAdminRoute && !user) return redirectTo("/login", path);
  if (isLoginRoute && user) return redirectTo("/admin");

  return response;
}

export const config = {
  // "monitoring" is Sentry's tunnel route: error reports must not pay for a
  // Supabase auth round-trip, and must never be redirected.
  matcher: ["/((?!monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
