"use client";

import { useEffect, useState } from "react";

interface AppWindow extends Window {
  Capacitor?: unknown;
}

export function useIsApp(): boolean {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const appWindow = window as AppWindow;
    const detected = typeof appWindow.Capacitor !== "undefined";
    if (detected) {
      setIsApp(true);
    }
    // #region agent log
    fetch("/api/debug-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: "1abe96",
        location: "useIsApp.ts:effect",
        message: "useIsApp Capacitor check",
        data: { detected },
        timestamp: Date.now(),
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  return isApp;
}

