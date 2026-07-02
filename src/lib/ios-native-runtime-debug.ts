import { isIosDebugEnabled } from "@/lib/ios-native";
import type { IosNativeDebugScope } from "@/lib/ios-native-debug-store";

const DEBUG_SESSION = "390123";

export type IosNativeRuntimeDebugPayload = {
  scope: IosNativeDebugScope;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
  level?: "info" | "error";
};

function shouldRelay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return isIosDebugEnabled();
}

/** Client-side runtime debug: console + optional relay to server when iOS debug is on. */
export function logIosNativeRuntime(payload: IosNativeRuntimeDebugPayload): void {
  const body = {
    sessionId: DEBUG_SESSION,
    timestamp: Date.now(),
    level: payload.level ?? "info",
    ...payload,
  };

  const prefix = `[IOS:${payload.scope}]`;
  if (payload.level === "error") {
    console.error(prefix, payload.message, payload.data ?? "");
  } else {
    console.info(prefix, payload.message, payload.data ?? "");
  }

  if (!shouldRelay()) {
    return;
  }

  fetch("/api/debug/ios-native-log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION,
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}
