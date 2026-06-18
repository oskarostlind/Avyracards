"use client";

import { useIsApp } from "@/hooks/useIsApp";
import { isIosNativePaymentsEnabled } from "@/lib/ios-native";

export function useIosNativePayments(): boolean {
  const isApp = useIsApp();
  return isApp && isIosNativePaymentsEnabled();
}
