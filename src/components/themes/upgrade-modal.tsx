"use client";

import { X, Check, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useIsApp } from "@/hooks/useIsApp";
import { useT } from "@/i18n/client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const t = useT();
  // "30 dagars öppet köp" gäller vår egen webbförsäljning. I appen går köpet via
  // App Store där Apple hanterar återbetalningar — att utlova en egen ångerrätt
  // där är ett vilseledande köpvillkor (3.1.2(c)/2.3.1).
  const isApp = useIsApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-nordic-highlight/40 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Dekorativ bakgrund */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/20 to-transparent pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          aria-label={t("themes.upgrade.close")}
        >
          <X size={20} />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
            <Crown size={32} className="text-white" fill="currentColor" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{t("themes.upgrade.title")}</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            {t("themes.upgrade.body")}
          </p>

          <div className="w-full space-y-3 mb-8 text-left">
            <FeatureRow text={t("themes.upgrade.feature")} />
            <FeatureRow text={t("themes.upgrade.feature2")} />
            <FeatureRow text={t("themes.upgrade.feature3")} />
          </div>

          <Link 
            href="/checkout/premium" 
            className="w-full py-3.5 rounded-xl bg-white text-slate-900 font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors shadow-lg group"
          >
            <span>{t("themes.upgrade.cta")}</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-4 text-xs text-slate-500">
            {isApp
              ? t("themes.upgrade.finePrintIos")
              : t("themes.upgrade.finePrintWeb")}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-300">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400">
        <Check size={12} strokeWidth={3} />
      </div>
      <span>{text}</span>
    </div>
  );
}