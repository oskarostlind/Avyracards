"use client";

import { useEffect } from "react";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { useIsAndroidApp } from "@/hooks/useNativePlatform";

/**
 * Android-appens skal. Gör ingenting på webben eller i iOS-appen.
 *
 * Appen är mörk rakt igenom, men Android väljer statusradens ikonfärg efter
 * systemets ljust/mörkt-läge — i ljust läge blir ikonerna mörka på mörk
 * bakgrund och syns inte. Stilen sätts därför här i stället för i
 * capacitor.config.ts, eftersom iOS också läser SystemBars-konfigurationen
 * därifrån och iOS-appen ska vara orörd.
 */
export function AndroidShell() {
  const isAndroidApp = useIsAndroidApp();

  useEffect(() => {
    if (!isAndroidApp) return;
    // Dark = ljus text/ikoner för mörk bakgrund.
    void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
  }, [isAndroidApp]);

  return null;
}
