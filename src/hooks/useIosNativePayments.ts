"use client";

import { useIsIosApp } from "@/hooks/useNativePlatform";
import { isIosNativePaymentsEnabled } from "@/lib/ios-native";

/**
 * StoreKit-köp finns bara i iOS-appen. Tidigare räckte `useIsApp()`, men den
 * är true även i Android-appen — där finns varken StoreKit eller pluginen.
 */
export function useIosNativePayments(): boolean {
  const isIosApp = useIsIosApp();
  return isIosApp && isIosNativePaymentsEnabled();
}
