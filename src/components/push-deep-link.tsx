"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PushNotifications } from "@capacitor/push-notifications";

import { useIsApp } from "@/hooks/useIsApp";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";
import { sanitizeDeepLink } from "@/lib/push-deep-link";

/**
 * Deeplink från push-notiser.
 *
 * Servern lägger `data.url` på notisen (se src/lib/push.ts och
 * src/app/api/analytics/route.ts). När användaren trycker på notisen navigerar
 * vi dit i stället för att bara öppna appen på senast besökta sida.
 *
 * Renderar ingenting och gör ingenting alls på webben — lyssnaren registreras
 * bara i det nativa Capacitor-skalet, enligt samma mönster som PushManager.
 */

export function PushDeepLink() {
  const isApp = useIsApp();
  const router = useRouter();

  useEffect(() => {
    if (!isApp) return;

    let listener: { remove: () => Promise<void> } | null = null;
    let cancelled = false;

    void PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = (action?.notification?.data ?? {}) as Record<string, unknown>;
      const url = sanitizeDeepLink(data.url);

      logIosNativeRuntime({
        scope: "PUSH",
        location: "push-deep-link.tsx:tap",
        message: "Notification tapped",
        data: { url: url ?? null, eventId: String(data.eventId ?? "") },
      });

      if (url) router.push(url);
    })
      .then((registered) => {
        // Komponenten kan hinna avmonteras innan plugin-promisen resolvar.
        if (cancelled) {
          void registered.remove();
          return;
        }
        listener = registered;
      })
      .catch(() => {
        // Plugin saknas (webb, eller nativt bygge utan push) — inget att göra.
      });

    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, [isApp, router]);

  return null;
}
