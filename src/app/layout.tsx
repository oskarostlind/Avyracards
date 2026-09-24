import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import SessionProviderWrapper from "@/components/providers/session-provider";
import CookieBanner from "@/components/cookie-banner";
import { SplashScreenManager } from "@/components/splash-screen-manager";
import { PushDeepLink } from "@/components/push-deep-link";
import { UniversalLinkHandler } from "@/components/universal-link-handler";
import { IosNativeDebugPanel } from "@/components/debug/ios-native-debug-panel";
import { LocaleProvider } from "@/i18n/client";
import { getI18n } from "@/i18n/server";
import { localeTags } from "@/i18n/config";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { defaultLocale, getMessages } from "@/i18n";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

/**
 * Metadatan är språkberoende (samma cookie som resten av sajten), därför
 * generateMetadata i stället för ett statiskt objekt. `title.template` lägger
 * på " | AvyraCards" på alla undersidor — sidtitlar ska därför hållas under
 * ~47 tecken. Canonical sätts per sida, inte här: en canonical i rotlayouten
 * skulle peka alla sidor på startsidan.
 */
export function generateMetadata(): Metadata {
  const { locale, t } = getI18n();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("seo.defaultTitle"),
      template: `%s | ${SITE_NAME}`,
    },
    description: t("seo.defaultDescription"),
    applicationName: SITE_NAME,
    icons: {
      icon: "/icon.png",
      apple: "/icon.png",
      shortcut: "/icon.png",
      other: [{ rel: "apple-touch-icon", url: "/icon.png" }],
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: localeTags[locale].replace("-", "_"),
      images: [{ url: "/avyra_transparent_v2.jpg", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
    },
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
    },
    formatDetection: {
      telephone: false,
    },
  };
}

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
  const { locale } = getI18n();
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
            {/* Ligger i rot-layouten, inte i dashboarden: en notis kan tryckas
                när appen är helt stängd, och då startar den på valfri sida. */}
            <PushDeepLink />
            {/* Universal links (avyracards.se/c/*, /u/*) — navigerar WebView:n
                till länkens mål när iOS öppnar appen i stället för Safari. */}
            <UniversalLinkHandler />
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
