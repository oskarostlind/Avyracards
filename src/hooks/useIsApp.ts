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

    // OBS: window.Capacitor finns även på webben eftersom plugins buntar in
    // @capacitor/core. Vi måste därför använda isNativePlatform() för att
    // korrekt skilja native-appen från en vanlig webbläsare.
    const capacitor = (window as AppWindow).Capacitor;
    setIsApp(capacitor?.isNativePlatform?.() === true);
  }, []);

  return isApp;
}

