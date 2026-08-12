"use client";

import { useState } from "react";
import { Star, Loader2, Calendar, CreditCard, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { NativePurchases } from "@capgo/native-purchases";
import { useIsApp } from "@/hooks/useIsApp";
import { IosRestorePurchasesButton } from "@/components/checkout/ios-restore-purchases-button";

interface BillingProps {
  isPremium: boolean;
  subscription?: {
    status: string;
    currentPeriodEnd: number;
    amount: number;
    currency: string;
    interval: string;
    createdAt: number;
    cancelAtPeriodEnd?: boolean; // Nytt fält
    brand?: string; // Nytt fält
    last4?: string; // Nytt fält
  } | null;
}

export function BillingView({ isPremium, subscription }: BillingProps) {
  const [loading, setLoading] = useState(false);

  // Guideline 3.1.1/3.1.3: i iOS-appen får vi inte skicka användaren till en
  // extern betalportal för ett digitalt abonnemang. Köp gjorda via IAP hanteras
  // dessutom av App Store, inte av Stripe — knappen hade lett fel även rent
  // funktionellt. På webben är Stripe-portalen oförändrad.
  const isApp = useIsApp();

  const handleManageInAppStore = async () => {
    try {
      await NativePurchases.manageSubscriptions();
    } catch {
      window.location.href = "https://apps.apple.com/account/subscriptions";
    }
  };

  const handlePortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Kunde inte öppna portalen.");
        setLoading(false);
      }
    } catch (error) {
      alert("Något gick fel.");
      setLoading(false);
    }
  };

  const formatDateSafe = (timestamp: number | undefined | null) => {
    if (!timestamp || isNaN(timestamp)) return "Datum saknas";
    try {
      const date = new Date(timestamp * 1000);
      if (isNaN(date.getTime())) return "Ogiltigt datum";
      return format(date, "d MMM yyyy", { locale: sv });
    } catch (e) {
      return "Fel vid datumvisning";
    }
  };

  const formattedPrice = subscription 
    ? new Intl.NumberFormat("sv-SE", { style: "currency", currency: subscription.currency.toUpperCase() }).format(subscription.amount / 100)
    : "";

  return (
    <div className="max-w-2xl space-y-6">
      
      {/* --- HUVUDKORT --- */}
      <div className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-slate-100">Din Plan</h3>
            {isPremium ? (
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star size={10} fill="currentColor" /> PREMIUM
              </span>
            ) : (
              <span className="bg-slate-800 text-nordic-highlight text-xs font-bold px-2 py-0.5 rounded-full">
                GRATIS
              </span>
            )}
          </div>
          <p className="text-sm text-nordic-highlight">
            {isPremium
              ? "Du har tillgång till alla premiumfunktioner."
              : "Uppgradera för att låsa upp statistik och teman."}
          </p>
          
          {/* VARNING OM UPPSAGD */}
          {subscription?.cancelAtPeriodEnd && (
             <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit border border-amber-500/20">
                <AlertTriangle size={14} />
                Avslutas {formatDateSafe(subscription.currentPeriodEnd)}
             </div>
          )}
        </div>

        {isPremium && isApp ? (
          <button
            onClick={handleManageInAppStore}
            className="whitespace-nowrap rounded-xl border border-nordic-highlight/40 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 flex items-center gap-2"
          >
            Hantera i App Store
          </button>
        ) : isPremium ? (
          <button 
            onClick={handlePortal}
            disabled={loading}
            className="whitespace-nowrap rounded-xl border border-nordic-highlight/40 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin h-4 w-4" />}
            Hantera via Stripe
          </button>
        ) : (
           <div className="flex flex-col gap-2 items-stretch">
             <Link
               href="/checkout/premium"
               className="whitespace-nowrap rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-nordic-secondary hover:bg-purple-500 shadow-lg shadow-purple-500/20 text-center"
             >
               Uppgradera Nu
             </Link>
             {isApp && <IosRestorePurchasesButton className="whitespace-nowrap rounded-xl border border-nordic-highlight/40 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2" />}
           </div>
        )}
      </div>

      {/* --- DETALJER --- */}
      {isPremium && subscription && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Nästa dragning */}
            <div className="p-4 rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/30">
                <div className="flex items-center gap-2 text-nordic-highlight mb-2 text-xs uppercase font-bold tracking-wider">
                    <Calendar size={14} /> 
                    {subscription.cancelAtPeriodEnd ? "Upphör" : "Nästa dragning"}
                </div>
                <div className="text-slate-100 font-medium">
                    {formatDateSafe(subscription.currentPeriodEnd)}
                </div>
            </div>

            {/* Kostnad & Kort */}
            <div className="p-4 rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/30">
                <div className="flex items-center gap-2 text-nordic-highlight mb-2 text-xs uppercase font-bold tracking-wider">
                    <CreditCard size={14} /> Kostnad
                </div>
                <div className="text-slate-100 font-medium">
                    {formattedPrice} <span className="text-nordic-highlight text-sm">/ {subscription.interval === 'month' ? 'mån' : 'år'}</span>
                </div>
                {/* Visa kortinfo om vi har det */}
                {subscription.last4 && (
                    <div className="text-xs text-slate-400 mt-1 uppercase">
                        {subscription.brand} •••• {subscription.last4}
                    </div>
                )}
            </div>

            {/* Medlem sedan */}
            <div className="p-4 rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/30">
                <div className="flex items-center gap-2 text-nordic-highlight mb-2 text-xs uppercase font-bold tracking-wider">
                    <Clock size={14} /> Medlem sedan
                </div>
                <div className="text-slate-100 font-medium">
                    {formatDateSafe(subscription.createdAt)}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}