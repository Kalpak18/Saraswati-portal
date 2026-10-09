import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Inter, Fraunces, Noto_Sans_Devanagari, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangContext";
import { Toaster } from "sonner";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { getSchoolInfo } from "@/lib/school";
import { BRAND_PRESETS, themeCss } from "@/lib/theme";
import { createSupabaseServer } from "@/lib/supabase/server";
import { slidesFromRow } from "@/lib/hero";
import { siteUrl } from "@/lib/siteUrl";

// -----------------------------------------------------------------------------
// Type system
// -----------------------------------------------------------------------------
// Inter: UI body text. Sharp, high x-height, excellent at small sizes.
// Fraunces: display / headlines. Variable soft serif — warm, trustworthy,
// the "school" character without being stuffy.
// Noto Sans Devanagari: bilingual pages need a Marathi face that keeps kerning
// coherent with Inter; Noto is the reference implementation.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "opsz"],
  variable: "--font-fraunces",
});
// Optional heading fonts for Settings → Appearance. Not preloaded: the
// browser only downloads one if the theme actually uses it.
const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-playfair",
});
const poppins = Poppins({
  subsets: ["latin", "devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: false,
  variable: "--font-poppins",
});
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
});

// Titles and link previews (WhatsApp, Facebook…) use the school's own name,
// logo and first hero photo from the admin, so nothing is hard-coded.
export async function generateMetadata(): Promise<Metadata> {
  const school = await getSchoolInfo();
  const name = school.name || "Saraswati Vidyalaya, Vasind";
  const supabase = await createSupabaseServer();
  const { data: hero } = await supabase.from("hero_content").select("*").limit(1).maybeSingle();
  const cover = slidesFromRow(hero).find((s) => s.type === "photo")?.url ?? slidesFromRow(hero)[0]?.poster_url ?? null;
  const image = cover ?? school.logo_url ?? undefined;
  const description = `${name} — ${school.address}. Results, notices, events and achievements.`;
  return {
    metadataBase: siteUrl(),
    title: { default: name, template: `%s · ${name}` },
    description,
    applicationName: name,
    formatDetection: { telephone: false },
    icons: school.logo_url ? { icon: school.logo_url, apple: school.logo_url } : undefined,
    openGraph: {
      type: "website",
      siteName: name,
      title: name,
      description,
      locale: "en_IN",
      alternateLocale: ["mr_IN"],
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: name, description, images: image ? [image] : undefined },
  };
}

// The browser's address-bar colour follows the brand colour from Appearance.
export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSchoolInfo();
  const brand = BRAND_PRESETS.find((b) => b.key === theme.brand) ?? BRAND_PRESETS[0];
  return { themeColor: brand.scale["700"], width: "device-width", initialScale: 1 };
}

export default async function RootLayout(props: LayoutProps<"/">) {
  // The saved appearance (brand colour, font, corners) as CSS variables.
  const css = themeCss((await getSchoolInfo()).theme);
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable} ${fraunces.variable} ${devanagari.variable} ${playfair.variable} ${poppins.variable}`}
    >
      {css && (
        <head>
          {/* Unlayered, so it overrides the default tokens from @theme. */}
          <style dangerouslySetInnerHTML={{ __html: css }} />
        </head>
      )}
      <body className="min-h-full bg-white text-slate-900 antialiased">
        <LangProvider>
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          {props.children}
          <InstallPrompt />
          <Toaster
            richColors
            position="top-right"
            closeButton
            expand={false}
            toastOptions={{
              duration: 4000,
              className: "!rounded-lg !border !border-slate-200 !shadow-lg",
            }}
          />
        </LangProvider>
      </body>
    </html>
  );
}
