import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes /lookup installable as a home-screen app on Android
 * and iOS. Kept minimal on purpose: no service worker (offline is a separate
 * concern with a Supabase-backed app), no icon paths that don't exist, no
 * splash screens. Every field here is one the browser actually reads.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Saraswati Portal",
    short_name: "Saraswati",
    description: "School results and report cards for parents and admins.",
    start_url: "/lookup",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#4f46e5",
    // Icons: an inline SVG monogram works on every browser and needs no file.
    // Replace with a raster PNG when the school ships their own artwork.
    icons: [
      {
        src:
          "data:image/svg+xml;utf8," +
          encodeURIComponent(
            `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
              <rect width='512' height='512' rx='96' fill='#4f46e5'/>
              <text x='50%' y='50%' text-anchor='middle' dominant-baseline='central'
                    font-family='system-ui,-apple-system,Segoe UI,sans-serif'
                    font-weight='700' font-size='260' fill='#ffffff'>S</text>
            </svg>`,
          ),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["education"],
  };
}
