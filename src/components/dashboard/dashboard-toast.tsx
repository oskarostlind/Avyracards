"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, AlertTriangle } from "lucide-react";

/*
 * Toast för dashboarden. Tidigare fanns ingen återkoppling alls för
 * t.ex. radering, synlighet eller redirect — och fel syntes aldrig.
 * Stöder en åtgärd ("Ångra") så att radering kan göras ogjord i stället
 * för att kräva en bekräftelsedialog.
 */

type Tone = "success" | "error" | "neutral";

interface ToastInput {
  message: string;
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  /** ms, standard 2600 (5000 med åtgärd) */
  duration?: number;
  /** Körs när toasten försvinner utan att åtgärden valts. */
  onExpire?: () => void;
}

interface ToastState extends ToastInput {
  id: number;
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export function useDashboardToast() {
  return useContext(ToastContext);
}

export function DashboardToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [shown, setShown] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const current = useRef<ToastState | null>(null);

  const finish = useCallback((expired: boolean) => {
    clearTimeout(timer.current);
    const prev = current.current;
    current.current = null;
    setToast(null);
    if (expired) prev?.onExpire?.();
  }, []);

  const show = useCallback(
    (input: ToastInput) => {
      // En ny toast ersätter den gamla — den gamla räknas som "utgången"
      // (t.ex. en väntande radering genomförs).
      if (current.current) {
        clearTimeout(timer.current);
        current.current.onExpire?.();
      }
      const next = { ...input, id: Date.now() };
      current.current = next;
      setToast(next);
      setShown(next);
      timer.current = setTimeout(() => finish(true), input.duration ?? (input.action ? 5000 : 2600));
    },
    [finish],
  );

  // Genomför väntande åtgärd om sidan lämnas.
  useEffect(() => {
    const flush = () => {
      if (current.current) finish(true);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      clearTimeout(timer.current);
    };
  }, [finish]);

  const visible = Boolean(toast);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 transition-[opacity,transform,visibility] duration-300 ease-out motion-reduce:translate-y-0 ${
          visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0"
        }`}
        style={{ bottom: "calc(max(env(safe-area-inset-bottom), 12px) + 84px)" }}
      >
        {shown && (
          <div
            className={`flex min-h-[48px] max-w-md items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
              visible ? "pointer-events-auto" : ""
            } ${
              shown.tone === "error"
                ? "border-red-500/30 bg-red-950/90 text-red-100"
                : "border-white/10 bg-slate-900/95 text-nordic-secondary"
            }`}
          >
            {shown.tone === "success" && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check size={14} strokeWidth={3} />
              </span>
            )}
            {shown.tone === "error" && <AlertTriangle size={18} className="shrink-0 text-red-300" />}
            <span>{shown.message}</span>
            {shown.action && (
              <button
                type="button"
                onClick={() => {
                  shown.action?.onClick();
                  finish(false);
                }}
                className="-mr-2 h-10 shrink-0 rounded-xl px-3 font-bold text-purple-300 active:bg-white/10"
              >
                {shown.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
