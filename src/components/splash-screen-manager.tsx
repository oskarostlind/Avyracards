"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@capacitor/splash-screen";
import { useIsApp } from "@/hooks/useIsApp";

export function SplashScreenManager() {
  const pathname = usePathname();
  const isApp = useIsApp();

  useEffect(() => {
    // #region agent log
    fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "1abe96",
        location: "splash-screen-manager.tsx:effect",
        message: "SplashScreenManager effect ran",
        data: { pathname, isApp, willCallHide: isApp && pathname !== "/" },
        timestamp: Date.now(),
        hypothesisId: "A_B_C",
      }),
    }).catch(() => {});
    // #endregion
    if (isApp && pathname !== "/") {
      // #region agent log
      fetch("/api/debug-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "1abe96",
          location: "splash-screen-manager.tsx:beforeHide",
          message: "Calling SplashScreen.hide()",
          data: {},
          timestamp: Date.now(),
          hypothesisId: "D",
        }),
      }).catch(() => {});
      // #endregion
      void SplashScreen.hide().then(
        () => {
          // #region agent log
          fetch("/api/debug-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "1abe96",
              location: "splash-screen-manager.tsx:afterHide",
              message: "SplashScreen.hide() resolved",
              data: {},
              timestamp: Date.now(),
              hypothesisId: "D",
            }),
          }).catch(() => {});
          // #endregion
        },
        (err: unknown) => {
          // #region agent log
          fetch("/api/debug-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: "1abe96",
              location: "splash-screen-manager.tsx:hideRejected",
              message: "SplashScreen.hide() rejected",
              data: { error: String(err) },
              timestamp: Date.now(),
              hypothesisId: "D",
            }),
          }).catch(() => {});
          // #endregion
        }
      );
    }
  }, [pathname, isApp]);

  return null;
}
