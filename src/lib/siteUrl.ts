/**
 * The site's public base URL for absolute links (sitemap, link previews).
 * Set NEXT_PUBLIC_SITE_URL on the host; Vercel's own URL is the fallback.
 */
export function siteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    "http://localhost:3000";
  return new URL(raw);
}
