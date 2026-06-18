"use client";

import { useEffect, useState } from "react";

interface AppWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
  };
}

export function useIsApp(): boolean {
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const capacitor = (window as AppWindow).Capacitor;
    setIsApp(capacitor?.isNativePlatform?.() === true);
  }, []);

  return isApp;
}
