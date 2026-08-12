"use client";

import { useCallback, useEffect, useState } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { FCM } from "@capacitor-community/fcm";
import { Bell, X } from "lucide-react";
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

  // Guideline 4.5.4 / 5.1.1(ii): systemdialogen för push fick tidigare
  // visas direkt när dashboarden monterades, utan att användaren fattat varför.
  // Apple avslår "permission at launch with no context", och en avvisad dialog
  // går inte att visa igen. Nu frågar vi först i appens egen ruta och triggar
  // systemdialogen enbart på användarens klick.
  const [needsOptIn, setNeedsOptIn] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [askNow, setAskNow] = useState(false);

  useEffect(() => {
    if (!isApp) return;

    let cancelled = false;

    void (async () => {
      try {
        const current = await PushNotifications.checkPermissions();
        if (cancelled) return;

        if (current.receive === "granted") {
          setAskNow(true);
        } else if (current.receive === "prompt" || current.receive === "prompt-with-rationale") {
          setNeedsOptIn(true);
        }
      } catch {
        // Plugin saknas eller kastar på webben — då finns ingen push att sätta upp.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isApp]);

  useEffect(() => {
    if (!isApp || !askNow) return;

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
  }, [isApp, askNow]);

  const handleEnable = useCallback(async () => {
    setNeedsOptIn(false);
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === "granted") {
        setAskNow(true);
      }
    } catch (err) {
      logIosNativeRuntime({
        scope: "PUSH",
        location: "push-manager.tsx:optIn",
        message: "requestPermissions failed",
        data: { error: err instanceof Error ? err.message : String(err) },
        level: "error",
      });
    }
  }, []);

  if (!isApp || !needsOptIn || dismissed) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300">
        <Bell size={16} />
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Slå på notiser</p>
          <p className="mt-0.5 text-xs text-slate-300/80">
            Få en notis när någon sparar din kontakt, när ditt kort skickas och när
            en beställning uppdateras. Du kan stänga av det när som helst.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEnable}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
          >
            Slå på notiser
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
          >
            Inte nu
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Stäng"
        className="text-slate-400 hover:text-slate-200"
      >
        <X size={16} />
      </button>
    </div>
  );
}
