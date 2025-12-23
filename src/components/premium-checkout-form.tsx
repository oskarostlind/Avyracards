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
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          variantId: variantId,
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
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-4 py-12">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* VÄNSTER: Säljtext */}
        <div className="space-y-10 order-2 lg:order-1">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-500/20">
                <Sparkles size={14} />
                <span className="font-bold tracking-wider uppercase text-xs">Premium Medlemskap</span>
             </div>
             <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                Allt du behöver för att <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">växa ditt varumärke</span>
             </h1>
             <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Lås upp teman, analysverktyg och ta bort loggor. Inga bindningstider.
             </p>
          </div>

          <div className="pl-4">
             <LiveProfileDemo />
          </div>
        </div>

        {/* HÖGER: Kassan */}
        <div className="order-1 lg:order-2">
           <div className="bg-[#0A0F1C] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

             <div className="mb-8 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-bold">Uppgradera</h2>
                    <p className="text-gray-500 text-sm">Gå vidare till säker betalning</p>
                 </div>
                 <div className="bg-gray-800/50 p-2 rounded-lg">
                    <CreditCard className="text-gray-400" />
                 </div>
             </div>

             <div className="bg-black/40 p-4 rounded-xl border border-gray-800 mb-6 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{productName}</span>
                    <span className="font-bold">{formattedPrice}<span className="text-gray-500 font-normal text-xs">/mån</span></span>
                 </div>
                 <div className="h-px bg-gray-800 w-full"></div>
                 <div className="flex justify-between items-center text-blue-400 text-sm font-medium">
                    <span>Att betala idag</span>
                    <span>{formattedPrice}</span>
                 </div>
             </div>

             <form onSubmit={handleCheckout} className="space-y-4">
                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                    <div className="mt-0.5 min-w-[16px]"><Check size={16} className="text-blue-400"/></div>
                    <p className="text-sm text-blue-200/80 leading-relaxed">
                        Du omdirigeras till Stripe för att slutföra betalningen säkert.
                    </p>
                 </div>

                 <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-white/5"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : "Gå till betalning"}
                    {!loading && <ArrowRight size={18} />}
                 </button>
             </form>
           </div>
           
           <div className="text-center mt-6">
              <Link href="/get-started" className="text-sm text-gray-500 hover:text-white transition-colors">
                 Avbryt
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}