import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

/** Search engines may index the public site; never the admin or report cards. */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/lookup/", "/login", "/forgot-password", "/reset-password", "/auth", "/monitoring"],
    }],
    sitemap: new URL("/sitemap.xml", base).toString(),
    host: base.origin,
  };
}
