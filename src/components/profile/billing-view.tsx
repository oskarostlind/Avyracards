"use client";

import { useState } from "react";
import { Star, Loader2, Calendar, CreditCard, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface BillingProps {
  isPremium: boolean;
  // userId borttaget – vi hanterar det i API:et istället
  subscription?: {
    status: string;
    currentPeriodEnd: number;
    amount: number;
    currency: string;
    interval: string;
    createdAt: number;
  } | null;
}

export function BillingView({ isPremium, subscription }: BillingProps) {
  const [loading, setLoading] = useState(false);

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

  // SÄKER DATUMHANTERING
  // Denna funktion förhindrar "RangeError: Invalid time value"
  const formatDateSafe = (timestamp: number | undefined | null) => {
    if (!timestamp || isNaN(timestamp)) return "Datum saknas";
    try {
      // Stripe skickar sekunder, JS vill ha millisekunder (* 1000)
      const date = new Date(timestamp * 1000);
      // Extra kontroll så datumet är giltigt
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
        </div>

        {isPremium ? (
          <button 
            onClick={handlePortal}
            disabled={loading}
            className="whitespace-nowrap rounded-xl border border-nordic-highlight/40 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin h-4 w-4" />}
            Hantera via Stripe
          </button>
        ) : (
           <Link
             href="/checkout/premium"
             className="whitespace-nowrap rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-nordic-secondary hover:bg-purple-500 shadow-lg shadow-purple-500/20"
           >
             Uppgradera Nu
           </Link>
        )}
      </div>

      {/* --- DETALJER --- */}
      {isPremium && subscription && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Nästa dragning */}
            <div className="p-4 rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/30">
                <div className="flex items-center gap-2 text-nordic-highlight mb-2 text-xs uppercase font-bold tracking-wider">
                    <Calendar size={14} /> Nästa dragning
                </div>
                <div className="text-slate-100 font-medium">
                    {formatDateSafe(subscription.currentPeriodEnd)}
                </div>
            </div>

            {/* Kostnad */}
            <div className="p-4 rounded-2xl border border-nordic-highlight/40 bg-nordic-primary/30">
                <div className="flex items-center gap-2 text-nordic-highlight mb-2 text-xs uppercase font-bold tracking-wider">
                    <CreditCard size={14} /> Kostnad
                </div>
                <div className="text-slate-100 font-medium">
                    {formattedPrice} <span className="text-nordic-highlight text-sm">/ {subscription.interval === 'month' ? 'mån' : 'år'}</span>
                </div>
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