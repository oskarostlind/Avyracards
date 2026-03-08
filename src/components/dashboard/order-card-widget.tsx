"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, X, ArrowRight, Sparkles } from "lucide-react";
import { VARIANT_IDS } from "@/lib/constants"; // <--- SÄKER IMPORT

interface OrderCardWidgetProps {
  isPremium: boolean;
  prices: { standard: string; bundle: string };
}

export function OrderCardWidget({ isPremium, prices }: OrderCardWidgetProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem("avyra_dismiss_card_widget");
    if (!isDismissed) setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("avyra_dismiss_card_widget", "true");
  };

  const handleBuy = () => {
    const variantId = isPremium ? VARIANT_IDS.STANDARD : VARIANT_IDS.BUNDLE;
    router.push(`/order?variantId=${variantId}`);
  };

  if (!isVisible) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-2xl animate-in fade-in slide-in-from-top-4">
      {/* ... resten av din JSX är oförändrad ... */}
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
      >
        <X size={20} />
      </button>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-inner">
            <CreditCard className="text-white" size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              Du saknar det fysiska kortet
              {!isPremium && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-extrabold uppercase tracking-wider">Rekommenderas</span>}
            </h3>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {isPremium 
                ? "Dra nytta av din premiumrabatt (30%) och beställ ditt NFC-kort idag."
                : "Just nu: Spara pengar med vårt startpaket (Premium + Kort)."
              }
            </p>
          </div>
        </div>

        <button
          onClick={handleBuy}
          className="group whitespace-nowrap flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-white/5 hover:bg-slate-200 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          {isPremium ? (
             <>Beställ kort <span className="font-normal text-slate-600">({prices.standard})</span></>
          ) : (
             <>
               <Sparkles size={16} className="text-amber-500 fill-amber-500" />
               Köp Startpaket ({prices.bundle})
             </>
          )}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-900" />
        </button>
      </div>
    </div>
  );
}