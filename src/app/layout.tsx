import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script"; // Krävs för AdSense
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
// Nu kommer denna import fungera eftersom vi fixade default export ovan
import SessionProviderWrapper from "@/components/providers/session-provider";

export const metadata = {
  title: "SocialCard",
  description: "Digital NFC-baserad visitkortslösning"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <head>
        {/* GOOGLE ADSENSE - Måste ligga här för att Google ska hitta den */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2616665688666431"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <SessionProviderWrapper>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}