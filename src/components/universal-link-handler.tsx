"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";

import { useIsApp } from "@/hooks/useIsApp";

/**
 * Universal Links in i appen.
 *
 * När iOS öppnar appen via en universal link (avyracards.se/c/* eller /u/*,
 * se AASA-filen i src/app/.well-known/) startar Capacitor-skalet på senast
 * besökta sida — inte på länkens mål. `appUrlOpen` bär den fullständiga
 * URL:en; här navigerar vi WebView:n dit.
 *
 * Bara /c och /u släpps igenom (samma lista som AASA-filen) — allt annat
 * ignoreras så att en oväntad länk aldrig kan styra appen till t.ex. admin.
 *
 * Samma listener-mönster som PushDeepLink: gör ingenting på webben.
 */

const ALLOWED_PREFIXES = ["/c/", "/u/"];

export function UniversalLinkHandler() {
  const isApp = useIsApp();
  const router = useRouter();

  useEffect(() => {
    if (!isApp) return;

    let listener: { remove: () => Promise<void> } | null = null;
    let cancelled = false;

    void CapacitorApp.addListener("appUrlOpen", (event) => {
      try {
        const url = new URL(event.url);
        const path = url.pathname;
        if (ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
          // Query-parametrar följer med (?source=nfc → statistiken).
          router.push(`${path}${url.search}`);
        }
      } catch {
        // Ogiltig URL — ignorera tyst.
      }
    })
      .then((registered) => {
        if (cancelled) {
          void registered.remove();
          return;
        }
        listener = registered;
      })
      .catch(() => {
        // Plugin saknas (webb) — inget att göra.
      });

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, [isApp, router]);

  return null;
}
