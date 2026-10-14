"use client";

import { useEffect, useState } from "react";
import { detectNativePlatform, type NativePlatform } from "@/lib/native-platform";

/**
 * Plattformen appen körs i. `null` tills första effekten körts (samma
 * asynkrona mönster som useIsApp — Capacitor-bryggan finns inte vid SSR).
 */
export function useNativePlatform(): NativePlatform | null {
  const [platform, setPlatform] = useState<NativePlatform | null>(null);

  useEffect(() => {
    setPlatform(detectNativePlatform());
  }, []);

  return platform;
}

/** True endast i iOS-appen. Ersätter `useIsApp()` där koden är Apple-specifik. */
export function useIsIosApp(): boolean {
  return useNativePlatform() === "ios";
}

/** True endast i Android-appen. */
export function useIsAndroidApp(): boolean {
  return useNativePlatform() === "android";
}
