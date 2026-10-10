import type { MetadataRoute } from "next";
import { getSchoolInfo } from "@/lib/school";
import { BRAND_PRESETS } from "@/lib/theme";

/**
 * Web app manifest — lets parents add the school site to their home screen.
 * Name and colour come from Settings; the icon is the uploaded logo, or a
 * monogram in the brand colour until one is uploaded.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const school = await getSchoolInfo();
  const name = school.name || "Saraswati Vidyalaya, Vasind";
  const brand = (BRAND_PRESETS.find((b) => b.key === school.theme.brand) ?? BRAND_PRESETS[0]).scale["700"];
  const initial = name.trim().charAt(0).toUpperCase() || "S";
  return {
    name,
    short_name: name.split(",")[0].slice(0, 24),
    description: "Results, notices, events and achievements.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: brand,
    icons: school.logo_url
      ? [{ src: school.logo_url, sizes: "any", purpose: "any" }]
      : [{
          src: "data:image/svg+xml;utf8," + encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='96' fill='${brand}'/>` +
            `<text x='50%' y='50%' text-anchor='middle' dominant-baseline='central' font-family='system-ui,sans-serif' font-size='280' font-weight='700' fill='white'>${initial}</text></svg>`),
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        }],
  };
}
