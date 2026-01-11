"use client";

import Link from "next/link";
import { Check, Sparkles, User, ArrowRight, CreditCard, Zap } from "lucide-react";

interface GetStartedViewProps {
  premiumProduct?: any;
  bundleProduct?: any;
}

export default function GetStartedView({ premiumProduct, bundleProduct }: GetStartedViewProps) {
  
  // --- 1. HÄMTA PRISER FRÅN DB-OBJEKTEN ---
  
  // Premium
  const premiumVariant = premiumProduct?.variants?.find((v: any) => v.isActive) || {};
  const premiumPrice = premiumVariant.price ? Math.round(premiumVariant.price / 100) : 69; // Fallback om DB failar

  // Bundle
  const bundleVariant = bundleProduct?.variants?.find((v: any) => v.isActive) || {};
  const bundlePrice = bundleVariant.price ? Math.round(bundleVariant.price / 100) : 299;
  
  // Ordinarie pris för bundle (för att visa rabatten)
  // Om du inte satt compareAtPrice i DB, kan vi räkna ut det (Premium 69 + Kort 199 = ca 268)
  // Men helst använder vi compareAtPrice från DB om det finns.
  const bundleOriginalPrice = bundleVariant.compareAtPrice 
    ? Math.round(bundleVariant.compareAtPrice / 100) 
    : 474; // Fallback eller uträknat värde

  return (
    <div className="min-h-screen bg-nordic-primary text-nordic-secondary flex flex-col items-center justify-center p-4 py-20">
      
      {/* HEADER */}
      <div className="text-center max-w-3xl mb-16 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          Välj nivån som passar dig
        </h1>
        <p className="text-nordic-highlight text-lg md:text-xl leading-relaxed">
          Från digital visitkort till komplett nätverkspaket. Uppgradera eller ändra plan när som helst.
        </p>
      </div>

      {/* PRICING GRID (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl w-full items-start">
        
        {/* 1. GRATIS */}
        <div className="p-8 rounded-3xl border border-nordic-highlight/20 bg-nordic-primary/50 backdrop-blur-sm flex flex-col hover:border-nordic-highlight/40 transition-all duration-300 h-full">
          <div className="mb-6">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-nordic-secondary">
              <User size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Digital Profil</h3>
            <p className="text-nordic-highlight text-sm">För dig som vill testa på.</p>
          </div>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-bold">0 kr</span>
            <span className="text-nordic-highlight text-sm">/ mån</span>
          </div>
          <div className="space-y-4 mb-8 flex-grow">
            <Feature text="Anpassad länk" />
            <Feature text="Grundläggande profil" />
            <Feature text="Obegränsade länkar" />
            <Feature text="QR-kod" />
          </div>
          <Link href="/register?plan=free" className="w-full py-3 rounded-xl border border-nordic-highlight/30 hover:bg-white/5 text-nordic-secondary font-bold text-center transition-all text-sm mt-auto">
            Kom igång gratis
          </Link>
        </div>

        {/* 2. PREMIUM (Hämtar pris från premium-subscription i DB) */}
        <div className="p-8 rounded-3xl border border-blue-500/30 bg-blue-900/5 backdrop-blur-sm flex flex-col hover:border-blue-500/50 transition-all duration-300 relative h-full">
          <div className="mb-6">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Premium</h3>
            <p className="text-nordic-highlight text-sm">För seriösa nätverkare.</p>
          </div>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-4xl font-bold">{premiumPrice} kr</span>
            <span className="text-nordic-highlight text-sm">/ mån</span>
          </div>
          <div className="space-y-4 mb-8 flex-grow">
            <Feature text="Allt i Gratis" highlight />
            <Feature text="Avancerad Statistik" highlight />
            <Feature text="Lås upp alla Teman" highlight />
            <Feature text="Ta bort branding" highlight />
            <Feature text="Prioriterad support" highlight />
          </div>
          <Link href="/register?plan=premium" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-center transition-all text-sm shadow-lg shadow-blue-900/20 mt-auto">
            Välj Premium
          </Link>
        </div>

        {/* 3. PRO BUNDLE (Hämtar pris från premium-bundle i DB) */}
        <div className="relative p-8 rounded-3xl border border-nordic-accent bg-gradient-to-b from-nordic-accent/10 to-nordic-primary/90 backdrop-blur-sm flex flex-col shadow-2xl shadow-nordic-accent/10 transform md:-translate-y-6 h-full">
          
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-nordic-accent text-nordic-primary text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-2 whitespace-nowrap">
            <Sparkles size={12} fill="currentColor" /> Mest Populär
          </div>

          <div className="mb-6 mt-2">
            <div className="w-12 h-12 bg-nordic-accent text-nordic-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-nordic-accent/30">
              <CreditCard size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Pro Bundle</h3>
            <p className="text-nordic-highlight text-sm">Premium + Fysiskt Kort.</p>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-white">{bundlePrice} kr</span>
            <span className="text-nordic-highlight text-sm line-through opacity-70">{bundleOriginalPrice} kr</span>
          </div>
          <p className="text-xs text-nordic-accent font-medium mb-8 bg-nordic-accent/10 inline-block px-2 py-1 rounded w-fit">
            Engångsavgift (inkl. kort & 1 mån premium)
          </p>

          <div className="space-y-4 mb-8 flex-grow">
            <Feature text="1 mån Premium ingår" highlight />
            <Feature text="Fysiskt NFC-kort i metall/plast" highlight icon={<CreditCard size={14}/>} />
            <Feature text="Egen design på kortet" highlight />
            <Feature text="Livstidsgaranti på kortet" highlight />
            <Feature text="Fri frakt" highlight />
          </div>

          <Link
            href="/register?plan=bundle" 
            className="w-full py-4 rounded-xl bg-nordic-accent text-nordic-primary font-bold text-center hover:bg-nordic-accent/90 shadow-lg shadow-nordic-accent/20 flex items-center justify-center gap-2 group mt-auto"
          >
            Skaffa Bundle <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </Link>
        </div>

      </div>

      <div className="mt-20 text-center border-t border-white/5 pt-10 w-full max-w-4xl">
        <p className="text-sm text-nordic-highlight mb-4">Litar du inte på oss än? Börja gratis.</p>
        <Link href="/register?plan=free" className="text-nordic-secondary underline hover:text-white text-sm">
          Skapa gratis konto utan kortuppgifter
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