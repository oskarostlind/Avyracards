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
    if (typeof appWindow.Capacitor !== "undefined") {
      setIsApp(true);
    }
  }, []);

  return isApp;
}

