"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { useIsApp } from "@/hooks/useIsApp";

export function PushManager() {
  const isApp = useIsApp();

  useEffect(() => {
    if (!isApp) return;

    let registrationListener: { remove: () => Promise<void> } | null = null;

    const setupPush = async () => {
      const permResult = await PushNotifications.requestPermissions();

      if (permResult.receive !== "granted") {
        return;
      }

      await PushNotifications.register();

      registrationListener = await PushNotifications.addListener(
        "registration",
        async (token: { value: string }) => {
          try {
            await fetch("/api/user/push-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: token.value }),
              credentials: "include",
            });
          } catch {
            // Tyst fel – användaren behöver inte se detta
          }
        }
      );
    };

    setupPush();

    return () => {
      registrationListener?.remove();
    };
  }, [isApp]);

  if (!isApp) return null;
  return null;
}
