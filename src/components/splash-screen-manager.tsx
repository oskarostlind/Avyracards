"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SplashScreen } from "@capacitor/splash-screen";
import { useIsApp } from "@/hooks/useIsApp";

export function SplashScreenManager() {
  const pathname = usePathname();
  const isApp = useIsApp();

  useEffect(() => {
    if (isApp && pathname !== "/") {
      void SplashScreen.hide();
    }
  }, [pathname, isApp]);

  return null;
}
