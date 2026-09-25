"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, X, ArrowRight, Sparkles } from "lucide-react";
import { VARIANT_IDS } from "@/lib/constants"; // <--- SÄKER IMPORT
import { useT } from "@/i18n/client";

interface OrderCardWidgetProps {
  isPremium: boolean;
  prices: { standard: string; bundle: string };
}

export function OrderCardWidget({ isPremium, prices }: OrderCardWidgetProps) {
  const t = useT();
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
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-4 pr-12 shadow-2xl animate-in fade-in slide-in-from-top-4 sm:p-6 sm:pr-14">
      <button 
        type="button"
        onClick={handleDismiss}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition-colors hover:text-white active:bg-white/10"
        aria-label={t("dashboard.orderWidget.dismiss")}
      >
        <X size={20} />
      </button>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
        <div className="flex gap-3 sm:gap-4">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner sm:flex">
            <CreditCard className="text-white" size={24} />
          </div>
          <div className="space-y-1">
            {!isPremium && (
              <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                {t("dashboard.orderWidget.recommended")}
              </span>
            )}
            <h3 className="flex items-center gap-2 text-[15px] font-bold text-white sm:text-base">
              <CreditCard className="text-white sm:hidden" size={18} />
              {t("dashboard.orderWidget.title")}
            </h3>
            <p className="max-w-md text-[13px] leading-relaxed text-slate-400 sm:text-sm">
              {isPremium 
                ? t("dashboard.orderWidget.bodyPremium")
                : t("dashboard.orderWidget.bodyFree")
              }
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBuy}
          className="group flex min-h-[48px] items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-white/5 hover:bg-slate-200 transition-all active:scale-95 w-full sm:w-auto justify-center"
        >
          {isPremium ? (
             <>{t("dashboard.orderWidget.orderCard")} <span className="font-normal text-slate-600">({prices.standard})</span></>
          ) : (
             <>
               <Sparkles size={16} className="text-amber-500 fill-amber-500" />
               {t("dashboard.orderWidget.buyBundle", { price: prices.bundle })}
             </>
          )}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-slate-900" />
        </button>
      </div>
    </div>
  );
}