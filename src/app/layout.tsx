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
  return (
    <html lang="sv">
      <body className={`${manrope.className} min-h-screen bg-black text-white antialiased`}>
        <SessionProviderWrapper>
          <SplashScreenManager />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>

          <CookieBanner />
          <IosNativeDebugPanel />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
