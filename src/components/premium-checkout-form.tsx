"use client";

import { useState } from "react";
import { Check, ArrowRight, CreditCard, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { LiveProfileDemo } from "@/components/live-profile-demo";
import { formatPrice } from "@/lib/products";
import { useIsApp } from "@/hooks/useIsApp";
import { useIosNativePayments } from "@/hooks/useIosNativePayments";
import { IosIapPremiumButton } from "@/components/checkout/ios-iap-premium-button";
import { IosRestorePurchasesButton } from "@/components/checkout/ios-restore-purchases-button";
import { SubscriptionTerms } from "@/components/checkout/subscription-terms";
import type { MappedProfileData } from "@/lib/profile-mapper";
import type { CustomThemeSettings } from "@/types/theme";

interface PremiumCheckoutProps {
  productName: string;
  price: number;
  variantId: string;
  /** Kundens riktiga profil — previewn ska visa den, inte mock-data. */
  profileData?: MappedProfileData | null;
  profileSettings?: CustomThemeSettings | null;
}

export function PremiumCheckoutForm({
  productName,
  price,
  variantId,
  profileData,
  profileSettings,
}: PremiumCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const isApp = useIsApp();
  const isIosCheckout = useIosNativePayments();

  // Guideline 3.1.1: digitalt innehåll måste köpas via Apples IAP. Tidigare låg
  // Stripe-vägen i else-grenen, vilket innebar att appen visade
  // Stripe-checkouten så fort NEXT_PUBLIC_IOS_NATIVE_PAYMENTS inte var satt
  // till "true" i miljön — en felkonfigurerad env-variabel hade alltså räckt
  // för ett garanterat avslag. Stripe-grenen renderas nu bara på webben.
  const showStripeCheckout = !isApp;
  const iapUnavailableInApp = isApp && !isIosCheckout;

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

      if (response.status === 401) {
        // Ej inloggad → skicka till login med återvändo i stället för alert
        window.location.href = "/login?callbackUrl=" + encodeURIComponent("/checkout/premium");
        return;
      }
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
    <div className="min-h-screen bg-[#030712] text-nordic-secondary flex items-center justify-center p-4 py-12">
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
              <p className="text-nordic-highlight text-lg leading-relaxed max-w-md">
                Lås upp teman, analysverktyg och ta bort loggor. Inga bindningstider.
              </p>
          </div>

          <div className="pl-4">
              <LiveProfileDemo data={profileData} settings={profileSettings} />
              {profileData && (
                <p className="mt-2 text-center text-xs text-nordic-highlight">
                  Din profil — så här ser den ut för den som blippar ditt kort.
                </p>
              )}
          </div>
        </div>

        {/* HÖGER: Kassan */}
        <div className="order-1 lg:order-2">
           <div className="bg-[#0A0F1C] border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

             <div className="mb-8 flex items-center justify-between">
                 <div>
                    <h2 className="text-2xl font-bold">Uppgradera</h2>
                    <p className="text-nordic-highlight text-sm">Gå vidare till säker betalning</p>
                 </div>
                 <div className="bg-gray-800/50 p-2 rounded-lg">
                    <CreditCard className="text-nordic-highlight" />
                 </div>
             </div>

             <div className="bg-nordic-primary/40 p-4 rounded-xl border border-gray-800 mb-6 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{productName}</span>
                    <span className="font-bold">{formattedPrice}<span className="text-nordic-highlight font-normal text-xs">/mån</span></span>
                 </div>
                 <div className="h-px bg-gray-800 w-full"></div>
                 <div className="flex justify-between items-center text-blue-400 text-sm font-medium">
                    <span>Att betala idag</span>
                    <span>{formattedPrice}</span>
                 </div>
             </div>

             <form onSubmit={handleCheckout} className="space-y-4">
                 {isIosCheckout && (
                   <>
                     <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                       <div className="mt-0.5 min-w-[16px]"><Check size={16} className="text-blue-400"/></div>
                       <p className="text-sm text-blue-200/80 leading-relaxed">
                         Premium köps via App Store i iOS-appen.
                       </p>
                     </div>
                     <IosIapPremiumButton
                       productKey="monthly"
                       label={`Köp ${productName} via App Store`}
                     />
                     <IosRestorePurchasesButton />
                     <SubscriptionTerms price={formattedPrice} viaAppStore />
                   </>
                 )}

                 {iapUnavailableInApp && (
                   <>
                     <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-200/90 leading-relaxed">
                       Premium kan just nu inte köpas i appen. Har du redan köpt
                       Premium kan du återställa köpet nedan.
                     </div>
                     <IosRestorePurchasesButton />
                   </>
                 )}

                 {showStripeCheckout && (
                   <>
                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                    <div className="mt-0.5 min-w-[16px]"><Check size={16} className="text-blue-400"/></div>
                    <p className="text-sm text-blue-200/80 leading-relaxed">
                        Du omdirigeras till Stripe för att slutföra betalningen säkert.
                    </p>
                 </div>

                 <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-nordic-secondary text-nordic-primary font-bold py-4 rounded-xl hover:bg-nordic-support transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-white/5"
                 >
                    {loading ? <Loader2 className="animate-spin" /> : "Gå till betalning"}
                    {!loading && <ArrowRight size={18} />}
                 </button>
                 <SubscriptionTerms price={formattedPrice} />
                 </>
                 )}
             </form>
           </div>
           
           <div className="text-center mt-6">
              <Link href="/get-started" className="text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors">
                 Avbryt
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}