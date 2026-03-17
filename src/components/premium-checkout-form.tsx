"use client";

import { useState } from "react";
import { Check, ArrowRight, CreditCard, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { LiveProfileDemo } from "@/components/live-profile-demo";
import { formatPrice } from "@/lib/products";

interface PremiumCheckoutProps {
  productName: string;
  price: number;
  variantId: string;
}

export function PremiumCheckoutForm({ 
  productName, 
  price, 
  variantId, 
}: PremiumCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const formattedPrice = formatPrice(price);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // VIKTIGT: Vi använder nu den nya "items"-strukturen
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: [
            { variantId: variantId, quantity: 1 }
          ]
        }),
      });

      if (!response.ok) throw new Error("Kunde inte starta betalning");
      const data = await response.json();
      
      if (data.url) window.location.href = data.url;
      
    } catch (error) {
      console.error(error);
      alert("Något gick fel. Försök igen.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#0a0a12] to-[#030712] text-nordic-secondary flex items-center justify-center p-4 py-12">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        {/* VÄNSTER: Säljtext + Premium-kort preview */}
        <div className="space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 w-fit px-3 py-1.5 rounded-full border border-purple-500/20">
              <Sparkles size={14} />
              <span className="font-bold tracking-wider uppercase text-xs">Premium Medlemskap</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Allt du behöver för att <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500">
                växa ditt varumärke
              </span>
            </h1>
            <p className="text-nordic-highlight text-lg leading-relaxed max-w-md">
              Lås upp teman, analysverktyg och ta bort loggor. Inga bindningstider.
            </p>
          </div>

          {/* Profilpreview som tydligt "premium-kort" med skugga och ram */}
          <div className="rounded-3xl p-1 bg-gradient-to-b from-purple-500/30 to-pink-500/30 shadow-xl shadow-purple-900/20 ring-1 ring-white/10">
            <div className="rounded-[22px] overflow-hidden bg-[#0c0c14] shadow-2xl">
              <LiveProfileDemo />
            </div>
          </div>
        </div>

        {/* HÖGER: Kassapanel med samma gradientaccenter */}
        <div className="order-1 lg:order-2">
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-purple-500/50 via-pink-500/30 to-purple-500/50 shadow-2xl shadow-purple-900/20">
            <div className="bg-[#0A0F1C] rounded-[23px] p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Uppgradera</h2>
                  <p className="text-nordic-highlight text-sm">Gå vidare till säker betalning</p>
                </div>
                <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
                  <CreditCard className="text-purple-400" size={20} />
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-700/80 mb-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{productName}</span>
                  <span className="font-bold">
                    {formattedPrice}
                    <span className="text-nordic-highlight font-normal text-xs">/mån</span>
                  </span>
                </div>
                <div className="h-px bg-slate-700 w-full" />
                <div className="flex justify-between items-center text-purple-300 text-sm font-medium">
                  <span>Att betala idag</span>
                  <span>{formattedPrice}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex gap-3 items-start">
                  <div className="mt-0.5 min-w-[16px] shrink-0">
                    <Check size={16} className="text-purple-400" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Du omdirigeras till Stripe för att slutföra betalningen säkert.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-purple-500/25 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Gå till betalning"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/get-started"
              className="text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
            >
              Avbryt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}