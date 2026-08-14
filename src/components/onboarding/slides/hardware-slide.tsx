"use client";

import { CreditCard, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/client";

// DINA ID:N (Dessa är oförändrade från din kod)
const VARIANTS = {
    STANDARD_CARD: "cmjbmtftt00056vxti90zdzue",
    PREMIUM_BUNDLE: "cmjbqkyrj0000cv4zvcqr82k4", 
};

interface HardwareContentProps {
  user: {
    isPremium: boolean;
    hasOrderedCard?: boolean;
  };
  prices: { standard: string; bundle: string };
  onFinish: () => void;
}

export function HardwareContent({ user, onFinish, prices }: HardwareContentProps) {
  const t = useT();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => { 
    setLoading(true);

    // LOGIK:
    // Om Premium -> Skicka ID för Standard Card
    // Om Gratis -> Skicka ID för Premium Bundle
    const variantId = user.isPremium ? VARIANTS.STANDARD_CARD : VARIANTS.PREMIUM_BUNDLE;
    
    // ÄNDRING: Skicka till /order istället för /api/checkout
    // Vi skickar med ?variantId=... så ordersidan vet vad som ska ligga i varukorgen
    router.push(`/order?variantId=${variantId}`);
  };

  // Om användaren redan har beställt kortet
  if (user.hasOrderedCard) {
      return (
          <div className="space-y-6">
              <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white tracking-tight">{t("onboarding.hardware.onTheWayTitle")}</h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                      {t("onboarding.hardware.onTheWayBody")}
                  </p>
              </div>
              <button 
                  onClick={onFinish}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                  {t("onboarding.hardware.openDashboard")} <ArrowRight size={18} />
              </button>
          </div>
      );
  }

  // SÄLJ-LÄGET
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4">
        {user.isPremium ? (
             /* --- PREMIUM USER VIEW (Enbart kort) --- */
             <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    {t("onboarding.hardware.exclusiveOffer")}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {t("onboarding.hardware.premiumTitle")}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    {t("onboarding.hardware.premiumBodyBefore")}{" "}
                    <span className="text-white font-semibold">{t("onboarding.hardware.premiumDiscount")}</span>{" "}
                    {t("onboarding.hardware.premiumBodyAfter")}
                </p>
             </>
         ) : (
             /* --- FREE USER VIEW (Bundle) --- */
             <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    {t("onboarding.hardware.recommended")}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    {t("onboarding.hardware.bundleTitle")}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    {t("onboarding.hardware.bundleBody")}
                </p>
             </>
         )}
      </div>

      <div className="space-y-4 pt-4">
        <button 
            onClick={handleBuy}
            disabled={loading}
            className="group w-full py-4 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-white/5 text-lg"
        >
            {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} className="text-slate-600 group-hover:text-slate-900" />}
            
            {/* PRIS OCH TEXT */}
            {user.isPremium
                ? t("onboarding.hardware.orderCard", { price: prices.standard })
                : t("onboarding.hardware.buyBundle", { price: prices.bundle })
            }
        </button>

        <button 
            onClick={onFinish}
            disabled={loading}
            className="w-full py-2 text-sm text-slate-500 hover:text-white font-medium transition-colors"
        >
            {t("onboarding.hardware.noThanks")}
        </button>
      </div>
    </div>
  );
}