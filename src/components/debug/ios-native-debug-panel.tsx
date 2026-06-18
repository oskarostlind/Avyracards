"use client";

import { useCallback, useEffect, useState } from "react";
import { Bug, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useIsApp } from "@/hooks/useIsApp";
import { isIosDebugEnabled, isIosNativePaymentsEnabled } from "@/lib/ios-native";

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

export function IosNativeDebugPanel() {
  const isApp = useIsApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DebugReport | null>(null);
  const [clientInfo, setClientInfo] = useState<string>("web");

  const enabled = isIosDebugEnabled() && isIosNativePaymentsEnabled();

  const loadReport = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/debug/ios-native", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as DebugReport;
        setReport(data);
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
        <div className="mt-2 rounded-2xl border border-amber-500/30 bg-slate-950/95 p-4 text-xs text-slate-200 shadow-2xl backdrop-blur">
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
            <Row label="Appversion" value={report ? `${report.appVersion} (${report.buildNumber})` : "—"} />
            <Row label="Apple login" value={boolLabel(report?.signInWithApple.configured)} />
            <Row label="Apple Pay" value={boolLabel(report?.applePay.configured)} />
            <Row label="StoreKit IAP" value={boolLabel(report?.iap.configured)} />
            <Row label="TestFlight redo" value={boolLabel(report?.readyForTestFlight)} />
          </div>

          {report?.issues?.length ? (
            <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
              <p className="mb-1 font-bold text-red-300">Problem</p>
              <ul className="list-disc space-y-1 pl-4 text-red-200">
                {report.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-green-300">Inga kända konfigurationsproblem.</p>
          )}
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
