export type IosNativeDebugScope =
  | "APPLE_SIGN_IN"
  | "APPLE_LINK"
  | "APPLE_PAY"
  | "IAP"
  | "IAP_ORDER"
  | "PUSH"
  | "SPLASH"
  | "APP_SHELL"
  | "SERVER";

export type IosNativeDebugEntry = {
  sessionId?: string;
  scope: IosNativeDebugScope;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
  runId?: string;
  level?: "info" | "error";
  timestamp: number;
};

const MAX_ENTRIES = 200;

const globalStore = globalThis as typeof globalThis & {
  __iosNativeDebugLogs?: IosNativeDebugEntry[];
};

export function appendIosNativeDebugLog(
  entry: Omit<IosNativeDebugEntry, "timestamp"> & { timestamp?: number }
): void {
  if (!globalStore.__iosNativeDebugLogs) {
    globalStore.__iosNativeDebugLogs = [];
  }

  const full: IosNativeDebugEntry = {
    ...entry,
    level: entry.level ?? "info",
    timestamp: entry.timestamp ?? Date.now(),
  };

  globalStore.__iosNativeDebugLogs.push(full);
  if (globalStore.__iosNativeDebugLogs.length > MAX_ENTRIES) {
    globalStore.__iosNativeDebugLogs.splice(
      0,
      globalStore.__iosNativeDebugLogs.length - MAX_ENTRIES
    );
  }

  const logFn = full.level === "error" ? console.error : console.info;
  logFn(
    JSON.stringify({
      type: "ios_native_debug",
      ...full,
    })
  );
}

export function getIosNativeDebugLogs(sessionId?: string): IosNativeDebugEntry[] {
  const store = globalStore.__iosNativeDebugLogs ?? [];
  if (!sessionId) {
    return store;
  }
  return store.filter((e) => e.sessionId === sessionId);
}
