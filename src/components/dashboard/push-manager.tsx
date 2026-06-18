"use client";

import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";
import { useIsApp } from "@/hooks/useIsApp";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";

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
      logIosNativeRuntime({
        scope: "PUSH",
        location: "push-manager.tsx:setup",
        message: "Starting push setup",
      });

      try {
        let permResult: { receive: string } | null = null;
        try {
          permResult = await PushNotifications.requestPermissions();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:permissions",
            message: "requestPermissions failed",
            data: { error: message },
            level: "error",
          });
          return;
        }

        logIosNativeRuntime({
          scope: "PUSH",
          location: "push-manager.tsx:permissions",
          message: "Permission result",
          data: { receive: permResult.receive },
        });

        if (permResult.receive !== "granted") {
          return;
        }

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

        try {
          await PushNotifications.register();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:register",
            message: "register failed",
            data: { error: message },
            level: "error",
          });
          return;
        }

        try {
          await registrationPromise;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:registration",
            message: "registrationError",
            data: { error: message },
            level: "error",
          });
          return;
        }

        let fcmToken: string | null = null;
        try {
          const res = await FCM.getToken();
          fcmToken = (res?.token ?? "").trim() || null;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:fcm",
            message: "FCM.getToken failed",
            data: { error: message },
            level: "error",
          });
          return;
        }

        if (!fcmToken) {
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:fcm",
            message: "FCM token empty",
            level: "error",
          });
          return;
        }

        try {
          await sendTokenToBackend(fcmToken);
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:backend",
            message: "Push token saved",
            data: { tokenLength: fcmToken.length },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logIosNativeRuntime({
            scope: "PUSH",
            location: "push-manager.tsx:backend",
            message: "POST push-token failed",
            data: { error: message },
            level: "error",
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logIosNativeRuntime({
          scope: "PUSH",
          location: "push-manager.tsx:catch",
          message: "setup failed",
          data: { error: message },
          level: "error",
        });
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
