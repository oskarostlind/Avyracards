"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@capacitor/splash-screen";
import { useIsApp } from "@/hooks/useIsApp";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";

export function SplashScreenManager() {
  const pathname = usePathname();
  const isApp = useIsApp();

  useEffect(() => {
    if (isApp && pathname !== "/") {
      logIosNativeRuntime({
        scope: "SPLASH",
        location: "splash-screen-manager.tsx:hide",
        message: "Hiding splash screen",
        data: { pathname },
      });
      void SplashScreen.hide();
    }
  }, [pathname, isApp]);

  return null;
}
