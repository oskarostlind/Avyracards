import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";
import type { IosNativeDebugScope } from "@/lib/ios-native-debug-store";

/** @deprecated Use logIosNativeRuntime directly. Kept for existing call sites. */
export function logIosDebug(
  scope: IosNativeDebugScope,
  message: string,
  data?: unknown,
  level: "info" | "error" = "info"
): void {
  logIosNativeRuntime({
    scope,
    location: scope,
    message,
    data:
      data !== undefined && typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : data !== undefined
          ? { value: data }
          : undefined,
    level,
  });
}
