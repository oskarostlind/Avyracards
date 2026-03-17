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
        // #region agent log
        try {
          alert("Push: start");
        } catch {
          // ignore
        }
        // #endregion

        // 1) Permissions
        let permResult: { receive: string } | null = null;
        try {
          permResult = await PushNotifications.requestPermissions();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          alert(`Push: requestPermissions failed: ${msg}`);
          return;
        }

        if (permResult.receive !== "granted") {
          alert(`Push: permissions not granted (${permResult.receive})`);
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
          const msg = err instanceof Error ? err.message : String(err);
          alert(`Push: register failed: ${msg}`);
          return;
        }

        // 4) Await registration event (or error)
        try {
          await registrationPromise;
          alert("Push: registered");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          alert(`Push: registrationError: ${msg}`);
          return;
        }

        // 5) Get FCM token
        let fcmToken: string | null = null;
        try {
          const res = await FCM.getToken();
          fcmToken = (res?.token ?? "").trim() || null;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          alert(`Push: FCM.getToken failed: ${msg}`);
          return;
        }

        if (!fcmToken) {
          alert("Push: FCM token empty");
          return;
        }

        // 6) Send token to backend
        try {
          await sendTokenToBackend(fcmToken);
          alert("Push: token saved");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          alert(`Push: POST /api/user/push-token failed: ${msg}`);
          return;
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
