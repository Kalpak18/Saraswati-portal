import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangContext";
import { Toaster } from "sonner";
import { RouteProgressBar } from "@/components/ui/RouteProgressBar";

export const metadata: Metadata = {
  title: {
    default: "Saraswati Portal",
    template: "%s · Saraswati Portal",
  },
  description: "School results & report cards",
  applicationName: "Saraswati Portal",
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="mr" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900">
        <LangProvider>
          {/* RouteProgressBar reads searchParams; keep it under Suspense so
              a Next dynamic-render prompt on the /login page never bubbles. */}
          <Suspense fallback={null}>
            <RouteProgressBar />
          </Suspense>
          {props.children}
          <Toaster
            richColors
            position="top-right"
            closeButton
            expand={false}
            toastOptions={{
              duration: 4000,
              className: "!rounded-lg !border !border-gray-200 !shadow-lg",
            }}
          />
        </LangProvider>
      </body>
    </html>
  );
}
