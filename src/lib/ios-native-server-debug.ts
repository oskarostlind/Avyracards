import {
  appendIosNativeDebugLog,
  type IosNativeDebugScope,
} from "@/lib/ios-native-debug-store";

export function logIosNativeServer(
  scope: IosNativeDebugScope,
  location: string,
  message: string,
  data?: Record<string, unknown>,
  level: "info" | "error" = "info"
): void {
  appendIosNativeDebugLog({
    sessionId: "390123",
    scope,
    location,
    message,
    data,
    level,
  });
}
