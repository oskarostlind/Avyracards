import "./globals.css";
import type { ReactNode } from "react";
import Script from "next/script"; 
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import SessionProviderWrapper from "@/components/providers/session-provider";
import CookieBanner from "@/components/cookie-banner"; 

export const metadata = {
  title: "SocialCard",
  description: "Digital NFC-baserad visitkortslösning"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      {/* Ingen manuell <head> här. Metadata-exporten ovan hanterar <head> automatiskt. */}
      
      <body className="min-h-screen bg-slate-950 text-slate-50">
        {/* Google AdSense Script - Placeras i body. Next.js hanterar injektionen. */}
        <Script
          id="adsbygoogle-init"
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2616665688666431"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        <SessionProviderWrapper>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          
          <CookieBanner />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}