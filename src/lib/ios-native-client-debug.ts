import { isIosDebugEnabled } from "@/lib/ios-native";

export function logIosDebug(scope: string, message: string, data?: unknown): void {
  if (!isIosDebugEnabled()) {
    return;
  }

  if (data !== undefined) {
    console.info(`[IOS_DEBUG:${scope}] ${message}`, data);
    return;
  }

  console.info(`[IOS_DEBUG:${scope}] ${message}`);
}
