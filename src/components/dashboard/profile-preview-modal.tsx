"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/i18n/client";

type ProfilePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  mode: "SOCIAL" | "BUSINESS";
};

/**
 * Förhandsvisning av den publika profilen.
 * Mobil: helskärm (tidigare en ritad telefon inuti telefonen, 85 % höjd).
 * Desktop: telefonram. ESC, tryck utanför och stäng-knapp stänger.
 */
export function ProfilePreviewModal({ isOpen, onClose, username, mode }: ProfilePreviewModalProps) {
  const t = useT();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  // mode i URL:en: publika sidan visar det läget även om det inte är aktivt live.
  const url = `/u/${username}?preview=true&mode=${mode}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("dashboard.previewModal.iframeTitle")}
      className="fixed inset-0 z-[65] flex flex-col bg-nordic-primary animate-in fade-in duration-200 sm:items-center sm:justify-center sm:bg-black/80 sm:p-6 sm:backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-slate-950 px-4 sm:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <p className="py-3 text-[15px] font-semibold text-nordic-secondary">
          {t("dashboard.mode.previewTitle")} · {mode === "BUSINESS" ? t("dashboard.mode.business") : t("dashboard.mode.social")}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("dashboard.previewModal.close")}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-slate-300 active:bg-white/10"
        >
          <X size={22} />
        </button>
      </div>

      <div className="relative min-h-0 w-full flex-1 sm:h-[85vh] sm:max-w-[400px] sm:flex-none sm:overflow-hidden sm:rounded-[3rem] sm:border-8 sm:border-nordic-highlight/40 sm:shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("dashboard.previewModal.close")}
          className="absolute right-4 top-4 z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white backdrop-blur-md sm:flex"
        >
          <X size={20} />
        </button>
        <iframe
          src={url}
          className="h-full w-full border-none bg-nordic-primary"
          title={t("dashboard.previewModal.iframeTitle")}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>

      <p className="pointer-events-none absolute right-6 top-6 hidden text-sm font-medium text-nordic-secondary/50 sm:block">
        {t("dashboard.previewModal.escToClose")}
      </p>
    </div>,
    document.body,
  );
}
