"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";
import { useIsApp } from "@/hooks/useIsApp";

async function sendTokenToBackend(token: string): Promise<void> {
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

export function PushManager() {
  const isApp = useIsApp();

  useEffect(() => {
    if (!isApp) return;

    let registrationListener: { remove: () => Promise<void> } | null = null;
    let registrationErrorListener: { remove: () => Promise<void> } | null = null;

    const setupPush = async () => {
      try {
        // 1) Permissions
        let permResult: { receive: string } | null = null;
        try {
          permResult = await PushNotifications.requestPermissions();
        } catch (err) {
          if (err instanceof Error) {
            console.error("[PushManager] requestPermissions failed:", err.message);
          }
          return;
        }

        if (permResult.receive !== "granted") {
          return;
        }

        // 2) Set listeners BEFORE register to avoid missing events
        const registrationPromise = new Promise<void>((resolve, reject) => {
          void PushNotifications.addListener("registration", () => {
            resolve();
          }).then((l) => {
            registrationListener = l;
          });

          void PushNotifications.addListener("registrationError", (e: unknown) => {
            const msg =
              typeof e === "object" && e && "error" in e
                ? String((e as { error?: unknown }).error)
                : String(e);
            reject(new Error(msg));
          }).then((l) => {
            registrationErrorListener = l;
          });
        });

        // 3) Register
        try {
          await PushNotifications.register();
        } catch (err) {
          if (err instanceof Error) {
            console.error("[PushManager] register failed:", err.message);
          }
          return;
        }

        // 4) Await registration event (or error)
        try {
          await registrationPromise;
        } catch (err) {
          if (err instanceof Error) {
            console.error("[PushManager] registrationError:", err.message);
          }
          return;
        }

        // 5) Get FCM token
        let fcmToken: string | null = null;
        try {
          const res = await FCM.getToken();
          fcmToken = (res?.token ?? "").trim() || null;
        } catch (err) {
          if (err instanceof Error) {
            console.error("[PushManager] FCM.getToken failed:", err.message);
          }
          return;
        }

        if (!fcmToken) {
          return;
        }

        // 6) Send token to backend
        try {
          await sendTokenToBackend(fcmToken);
        } catch (err) {
          if (err instanceof Error) {
            console.error("[PushManager] POST /api/user/push-token failed:", err.message);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error("[PushManager] setup failed:", err.message);
        }
      }
    };

    setupPush();

    return () => {
      void registrationListener?.remove();
      void registrationErrorListener?.remove();
    };
  }, [isApp]);

  if (!isApp) return null;
  return null;
}
