"use client";

import Link from "next/link";
import { Check, Sparkles, User, ArrowRight, CreditCard, Zap } from "lucide-react";
import { useIsApp } from "@/hooks/useIsApp";
import { useT } from "@/i18n/client";

interface GetStartedViewProps {
  premiumProduct?: any;
  bundleProduct?: any;
}

export default function GetStartedView({ premiumProduct, bundleProduct }: GetStartedViewProps) {
  const t = useT();
  const price = (amount: number | string) => t("order.price", { amount: String(amount) });
  // Guideline 3.1.1/2.3.1: startpaketet (kort + gratis premiummånad som
  // levereras via kortordern, ej IAP) erbjuds inte i iOS-appen — marknadsför
  // det därför inte heller där.
  const isApp = useIsApp();
  
  // --- 1. HÄMTA PRISER FRÅN DB-OBJEKTEN ---
  
  // Premium
  const premiumVariant = premiumProduct?.variants?.find((v: any) => v.isActive) || {};
  const premiumPrice = premiumVariant.price ? Math.round(premiumVariant.price / 100) : 69;

  // Bundle
  const bundleVariant = bundleProduct?.variants?.find((v: any) => v.isActive) || {};
  const bundlePrice = bundleVariant.price ? Math.round(bundleVariant.price / 100) : 249;
  
  const bundleOriginalPrice = bundleVariant.compareAtPrice 
    ? Math.round(bundleVariant.compareAtPrice / 100) 
    : 349; 

  return (
    <div className="min-h-screen bg-nordic-primary text-nordic-secondary flex flex-col items-center justify-center p-4 py-20">
      
      {/* HEADER */}
      <div className="text-center max-w-3xl mb-16 animate-in slide-in-from-bottom-4 fade-in duration-700">
        {/* FIX: Lade till pb-2 för att g:et inte ska kapas av bg-clip-text, och ändrade mb-6 till mb-4 för att kompensera */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 pb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          {t("getStarted.title")}
        </h1>
        <p className="text-nordic-highlight text-lg md:text-xl leading-relaxed">
          {t("getStarted.subtitle")}
        </p>
      </div>

      {/* PRICING GRID (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl w-full items-start">
        
        {/* 1. GRATIS (Vänster) */}
        <div className="p-8 rounded-3xl border border-nordic-highlight/20 bg-nordic-primary/50 backdrop-blur-sm flex flex-col transition-all duration-300 h-full select-none hover:-translate-y-2 hover:border-nordic-highlight/40 active:scale-[0.98]">
          <div className="mb-6">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-nordic-secondary">
              <User size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("getStarted.free.name")}</h3>
            <p className="text-nordic-highlight text-sm">{t("getStarted.free.tagline")}</p>
          </div>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-bold">{t("getStarted.free.price")}</span>
            <span className="text-nordic-highlight text-sm">{t("getStarted.perMonth")}</span>
          </div>
          <div className="space-y-4 mb-8 flex-grow">
            <Feature text={t("getStarted.free.f1")} />
            <Feature text={t("getStarted.free.f2")} />
            <Feature text={t("getStarted.free.f3")} />
            <Feature text={t("getStarted.free.f4")} />
            <Feature text={t("getStarted.free.f5")} />
          </div>
          <Link href="/register?plan=free" className="w-full py-3 rounded-xl border border-nordic-highlight/30 hover:bg-white/5 text-nordic-secondary font-bold text-center transition-all text-sm mt-auto">
            {t("getStarted.free.cta")}
          </Link>
        </div>

        {/* 2. PRO BUNDLE (Mitten - Upplyft) — visas inte i appen (3.1.1) */}
        {!isApp && (
        <div className="relative p-8 rounded-3xl border border-nordic-accent bg-gradient-to-b from-nordic-accent/10 to-nordic-primary/90 backdrop-blur-sm flex flex-col shadow-2xl shadow-nordic-accent/10 transform md:-translate-y-6 transition-all duration-300 h-full select-none hover:-translate-y-2 md:hover:-translate-y-8 active:scale-[0.98]">
          
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-nordic-accent text-nordic-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-2 whitespace-nowrap">
            <Sparkles size={12} fill="currentColor" /> {t("getStarted.bundle.badge")}
          </div>

          <div className="mb-6 mt-2">
            <div className="w-12 h-12 bg-nordic-accent text-nordic-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-nordic-accent/30">
              <CreditCard size={24} />
            </div>
            {/* Ett namn genomgående: "Startpaket" (hette tidigare Pro Bundle här,
                Startpaket i dashboarden och Pro på ordersidan — förvirrande) */}
            <h3 className="text-xl font-bold mb-2 text-white">{t("getStarted.bundle.name")}</h3>
            <p className="text-nordic-highlight text-sm">{t("getStarted.bundle.tagline")}</p>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{price(bundlePrice)}</span>
            <span className="text-nordic-highlight text-sm line-through opacity-70">{price(bundleOriginalPrice)}</span>
          </div>
          <p className="text-xs text-nordic-accent font-medium mb-8 bg-nordic-accent/10 inline-block px-2 py-1 rounded w-fit">
            {t("getStarted.bundle.note")}
          </p>

          <div className="space-y-4 mb-8 flex-grow">
            <Feature text={t("getStarted.bundle.f1")} highlight />
            <Feature text={t("getStarted.bundle.f2")} highlight icon={<CreditCard size={14}/>} />
            <Feature text={t("getStarted.bundle.f3")} highlight />
          </div>

          <Link
            href="/register?plan=bundle" 
            className="w-full py-4 rounded-xl bg-nordic-accent text-nordic-primary font-bold text-center hover:bg-nordic-accent/90 shadow-lg shadow-nordic-accent/20 flex items-center justify-center gap-2 group mt-auto"
          >
            {t("getStarted.bundle.cta")} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </Link>
        </div>
        )}

        {/* 3. PREMIUM (Höger) */}
        <div className="p-8 rounded-3xl border border-blue-500/30 bg-blue-900/5 backdrop-blur-sm flex flex-col transition-all duration-300 relative h-full select-none hover:-translate-y-2 hover:border-blue-500/50 active:scale-[0.98]">
          <div className="mb-6">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">{t("getStarted.premium.name")}</h3>
            <p className="text-nordic-highlight text-sm">{t("getStarted.premium.tagline")}</p>
          </div>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-bold">{price(premiumPrice)}</span>
            <span className="text-nordic-highlight text-sm">{t("getStarted.perMonth")}</span>
          </div>
          <div className="space-y-4 mb-8 flex-grow">
            <Feature text={t("getStarted.premium.f1")} highlight />
            <Feature text={t("getStarted.premium.f2")} highlight />
            <Feature text={t("getStarted.premium.f3")} highlight />
            <Feature text={t("getStarted.premium.f4")} highlight />
            <Feature text={t("getStarted.premium.f5")} highlight />
          </div>
          <Link href="/register?plan=premium" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-center transition-all text-sm shadow-lg shadow-blue-900/20 mt-auto">
            {t("getStarted.premium.cta")}
          </Link>
        </div>

      </div>

      <div className="mt-20 text-center border-t border-white/5 pt-10 w-full max-w-4xl">
        <p className="text-sm text-nordic-highlight mb-4">{t("getStarted.trustTitle")}</p>
        <Link href="/register?plan=free" className="text-nordic-secondary underline hover:text-white text-sm">
          {t("getStarted.trustCta")}
        </Link>
      </div>

    </div>
  );
}

function Feature({ text, highlight = false, icon }: { text: string; highlight?: boolean, icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 rounded-full p-1 flex-shrink-0 ${highlight ? "bg-nordic-accent text-nordic-primary" : "bg-white/10 text-nordic-highlight"}`}>
        <Check size={10} strokeWidth={4} />
      </div>
      <span className={`text-sm flex items-center gap-2 ${highlight ? "text-white font-medium" : "text-nordic-highlight"}`}>
        {text} {icon && <span className="text-nordic-accent">{icon}</span>}
      </span>
    </div>
  );
}