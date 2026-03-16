"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";
import { useIsApp } from "@/hooks/useIsApp";

async function sendFcmTokenToBackend(token: string): Promise<void> {
  const res = await fetch("/api/user/push-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`push-token API responded with ${res.status}`);
  }
}

async function tryGetFcmTokenAndSend(): Promise<boolean> {
  try {
    const { token } = await FCM.getToken();
    if (token?.trim()) {
      await sendFcmTokenToBackend(token.trim());
      return true;
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("[PushManager] FCM getToken or send failed:", err.message);
    }
  }
  return false;
}

export function PushManager() {
  const isApp = useIsApp();

  useEffect(() => {
    if (!isApp) return;

    let registrationListener: { remove: () => Promise<void> } | null = null;

    const setupPush = async () => {
      try {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== "granted") {
          return;
        }

        await PushNotifications.register();

        registrationListener = await PushNotifications.addListener(
          "registration",
          () => {
            void tryGetFcmTokenAndSend();
          }
        );

        void tryGetFcmTokenAndSend();
      } catch (err) {
        if (err instanceof Error) {
          console.error("[PushManager] setup failed:", err.message);
        }
      }
    };

    setupPush();

    return () => {
      void registrationListener?.remove();
    };
  }, [isApp]);

  if (!isApp) return null;
  return null;
}
