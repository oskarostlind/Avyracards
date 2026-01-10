"use client";

import { CreditCard, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
                  <h2 className="text-3xl font-bold text-white tracking-tight">Ditt kort är på väg! 🚀</h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                      Allt är inställt. Du kan börja bygga din profil medan du väntar på posten.
                  </p>
              </div>
              <button 
                  onClick={onFinish}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                  Öppna Dashboard <ArrowRight size={18} />
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
                    Exklusivt Erbjudande
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Ditt fysiska visitkort
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Som Premium-medlem har du <span className="text-white font-semibold">30% rabatt</span> på hårdvaran.
                </p>
             </>
         ) : (
             /* --- FREE USER VIEW (Bundle) --- */
             <>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    Rekommenderat val
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Startpaket: Allt-i-ett
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                    Få Premium Analytics, Teman och NFC-kortet i ett paket (inkl. 1 fri månad).
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
                ? `Beställ kort (${prices.standard})` 
                : `Köp Startpaket (${prices.bundle})`
            }
        </button>

        <button 
            onClick={onFinish}
            disabled={loading}
            className="w-full py-2 text-sm text-slate-500 hover:text-white font-medium transition-colors"
        >
            Nej tack, jag nöjer mig med det digitala just nu
        </button>
      </div>
    </div>
  );
}