import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/lib/i18n/LangContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Saraswati Portal",
  description: "School results & report cards",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="mr" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">
        <LangProvider>
          {props.children}
          <Toaster richColors position="top-right" />
        </LangProvider>
      </body>
    </html>
  );
}
