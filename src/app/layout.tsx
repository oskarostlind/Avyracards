import "./globals.css";
import type { ReactNode } from "react";
import type { Viewport } from "next";
import Script from "next/script";
import { Manrope } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import SessionProviderWrapper from "@/components/providers/session-provider";
import CookieBanner from "@/components/cookie-banner";

// Initiera Manrope-fonten
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "AvyraCards",
  description: "Digital NFC-baserad visitkortslösning",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Kontrollera om vi kör i produktion (Live) eller Development (Lokalt)
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="sv">
      {/* Ingen manuell <head> här. Metadata-exporten hanterar <head> automatiskt. */}

      /<body
        className={`${manrope.className} min-h-screen bg-nordic-primary text-nordic-secondary antialiased`}
      >

        <body className={`${manrope.className} min-h-screen bg-black text-white antialiased`}></body>
        {/* Google AdSense Script - Laddas ENDAST om vi är i produktion */}
        {isProduction && (
          <Script
            id="adsbygoogle-init"
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2616665688666431"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

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