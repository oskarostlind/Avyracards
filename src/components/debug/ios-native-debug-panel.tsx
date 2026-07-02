"use client";

import { useCallback, useEffect, useState } from "react";
import { Bug, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { App } from "@capacitor/app";
import { useIsApp } from "@/hooks/useIsApp";
import {
  isIosDebugEnabled,
  isIosNativePaymentsEnabled,
  MIN_IOS_BUILD_WITH_APPLE_SIGN_IN,
} from "@/lib/ios-native";

interface CapacitorWindow extends Window {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
  };
}

interface DebugReport {
  readyForTestFlight: boolean;
  issues: string[];
  flags: {
    iosNativePayments: boolean;
    iosDebug: boolean;
    nodeEnv: string;
  };
  signInWithApple: { configured: boolean };
  applePay: { configured: boolean };
  iap: { configured: boolean };
  appVersion: string;
  buildNumber: string;
}

interface RuntimeLogEntry {
  scope: string;
  location: string;
  message: string;
  level?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export function IosNativeDebugPanel() {
  const isApp = useIsApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DebugReport | null>(null);
  const [runtimeLogs, setRuntimeLogs] = useState<RuntimeLogEntry[]>([]);
  const [clientInfo, setClientInfo] = useState<string>("web");
  const [deviceBuild, setDeviceBuild] = useState<string | null>(null);

  const enabled = isIosDebugEnabled() && isIosNativePaymentsEnabled();
  const deviceBuildNumber = deviceBuild ? Number.parseInt(deviceBuild.replace(/.*\((\d+)\)/, "$1"), 10) : NaN;
  const needsNewNativeBuild =
    Number.isFinite(deviceBuildNumber) && deviceBuildNumber < MIN_IOS_BUILD_WITH_APPLE_SIGN_IN;

  const loadReport = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    try {
      const [configRes, logsRes] = await Promise.all([
        fetch("/api/debug/ios-native", { cache: "no-store" }),
        fetch("/api/debug/ios-native-log?limit=20", { cache: "no-store" }),
      ]);

      if (configRes.ok) {
        const data = (await configRes.json()) as DebugReport;
        setReport(data);
      }

      if (logsRes.ok) {
        const logs = (await logsRes.json()) as { entries: RuntimeLogEntry[] };
        setRuntimeLogs(logs.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const capacitor = (window as CapacitorWindow).Capacitor;
    const platform = capacitor?.getPlatform?.() ?? (isApp ? "native" : "web");
    setClientInfo(platform);

    if (isApp) {
      void App.getInfo()
        .then((info) => setDeviceBuild(`${info.version} (${info.build})`))
        .catch(() => setDeviceBuild(null));
    }

    void loadReport();
  }, [enabled, isApp, loadReport]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-black shadow-lg"
      >
        <Bug size={14} />
        iOS Debug
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <div className="mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-amber-500/30 bg-slate-950/95 p-4 text-xs text-slate-200 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-bold text-amber-300">Native payments debug</span>
            <button
              type="button"
              onClick={() => void loadReport()}
              className="rounded-lg border border-white/10 p-1 hover:bg-white/5"
              aria-label="Uppdatera debug"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="space-y-2">
            <Row label="Klient" value={`${clientInfo}${isApp ? " (isNativePlatform)" : ""}`} />
            <Row
              label="Enhetsbuild"
              value={deviceBuild ?? (report ? `${report.appVersion} (${report.buildNumber})` : "—")}
            />
            <Row label="Apple login" value={boolLabel(report?.signInWithApple.configured)} />
            <Row label="Apple Pay" value={boolLabel(report?.applePay.configured)} />
            <Row label="StoreKit IAP" value={boolLabel(report?.iap.configured)} />
            <Row label="TestFlight redo" value={boolLabel(report?.readyForTestFlight)} />
          </div>

          {needsNewNativeBuild ? (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-100">
              <p className="font-bold text-amber-200">Gammal native-build</p>
              <p className="mt-1">
                Apple Sign-In kräver TestFlight-build {MIN_IOS_BUILD_WITH_APPLE_SIGN_IN} eller högre. Öppna
                TestFlight och uppdatera appen.
              </p>
            </div>
          ) : null}

          {report?.issues?.length ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="mb-1 font-bold text-red-300">Konfigurationsproblem</p>
              <ul className="list-disc space-y-1 pl-4 text-red-200">
                {report.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-green-300">Inga kända konfigurationsproblem.</p>
          )}

          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="mb-2 font-bold text-amber-200">Senaste runtime-loggar</p>
            {runtimeLogs.length === 0 ? (
              <p className="text-slate-400">Inga loggar ännu. Testa Apple login, IAP, push m.m.</p>
            ) : (
              <ul className="space-y-2">
                {runtimeLogs
                  .slice()
                  .reverse()
                  .map((entry, index) => (
                    <li
                      key={`${entry.timestamp}-${index}`}
                      className={`rounded-lg border px-2 py-1.5 ${
                        entry.level === "error"
                          ? "border-red-500/30 bg-red-500/10 text-red-200"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="font-mono text-[10px] text-amber-300">{entry.scope}</div>
                      <div>{entry.message}</div>
                      {entry.data?.error ? (
                        <div className="mt-0.5 text-[10px] opacity-80">{String(entry.data.error)}</div>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-right">{value}</span>
    </div>
  );
}

function boolLabel(value: boolean | undefined): string {
  if (value === undefined) {
    return "—";
  }
  return value ? "OK" : "NEJ";
}
