import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Fraunces, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangContext";
import { Toaster } from "sonner";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";
import { InstallPrompt } from "@/components/ui/InstallPrompt";

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
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: {
    default: "Saraswati School",
    template: "%s · Saraswati School",
  },
  description: "A modern school portal — results, events, achievements and more.",
  applicationName: "Saraswati School",
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#0f766e", // teal-700 — matches the primary in globals.css
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html
      lang="mr"
      className={`h-full ${inter.variable} ${fraunces.variable} ${devanagari.variable}`}
    >
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
