import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import SessionProviderWrapper from "@/components/providers/session-provider";
import CookieBanner from "@/components/cookie-banner";
import { SplashScreenManager } from "@/components/splash-screen-manager";
import { IosNativeDebugPanel } from "@/components/debug/ios-native-debug-panel";
import { LocaleProvider } from "@/i18n/client";
import { getLocale } from "@/i18n/server";
import { defaultLocale, getMessages } from "@/i18n";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AvyraCards",
  description: "Digital NFC-baserad visitkortslösning",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
    shortcut: "/icon.png",
    other: [{ rel: "apple-touch-icon", url: "/icon.png" }],
  },
  openGraph: {
    images: ["/avyra_transparent_v2.jpg"],
  },
  appleWebApp: {
    capable: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Språket läses ur cookien (se src/i18n/config.ts för varför det inte ligger
  // i URL:en). Bara det aktiva språkets meddelanden — plus svenska som
  // fallback — skickas ned i RSC-payloaden, inte hela bunten.
  const locale = getLocale();
  const messages = getMessages(locale);
  const fallbackMessages = getMessages(defaultLocale);

  return (
    <html lang={locale}>
      <body className={`${manrope.className} min-h-screen bg-black text-white antialiased`}>
        <LocaleProvider
          locale={locale}
          messages={messages}
          fallbackMessages={fallbackMessages}
        >
          <SessionProviderWrapper>
            <SplashScreenManager />
            <div className="flex min-h-screen flex-col print:min-h-0 print:block">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>

            <CookieBanner />
            <IosNativeDebugPanel />
          </SessionProviderWrapper>
        </LocaleProvider>
      </body>
    </html>
  );
}
