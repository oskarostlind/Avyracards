"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { Check, CreditCard, Sparkles, User, ArrowRight } from "lucide-react";

interface GetStartedViewProps {
  premiumProduct?: any;
  physicalProduct?: any;
}

export default function GetStartedView({ premiumProduct, physicalProduct }: GetStartedViewProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollPosition = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollPosition / width);
      setActiveSlide(index);
    }
  };

  // Använd DB-features eller fallback (om DB-arrayen är tom)
  const premiumFeatures = premiumProduct?.features.length > 0 
    ? premiumProduct.features 
    : ["Inga annonser", "Avancerad statistik", "Prioriterad support"];

  const physicalFeatures = physicalProduct?.features.length > 0
    ? physicalProduct.features
    : ["Fysiskt NFC-kort", "Ingen app krävs", "Livstids access"];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-6xl w-full py-8 md:py-12 flex flex-col h-full">
        
        {/* Header Section */}
        <div className="text-center mb-8 md:mb-16 space-y-3 px-2 flex-shrink-0">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent pb-1">
            Välj hur du vill synas
          </h1>
          <p className="text-gray-400 text-sm md:text-xl max-w-2xl mx-auto leading-relaxed hidden md:block">
            Börja helt gratis, uppgradera för professionella verktyg eller ta ditt nätverkande till nästa nivå med våra NFC-kort.
          </p>
          <p className="text-gray-400 text-sm md:hidden">
            Swipea för att se alternativen
          </p>
        </div>

        {/* --- CAROUSEL / GRID CONTAINER --- */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            flex lg:grid lg:grid-cols-3 gap-4 lg:gap-8 
            overflow-x-auto snap-x snap-mandatory scrollbar-hide 
            pb-8 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0
            items-stretch
            lg:pt-10 
          "
        >
          
          {/* 1. GRATIS PROFIL */}
          <div className="min-w-[85vw] md:min-w-[50vw] lg:min-w-0 snap-center flex flex-col h-full">
            <div className="group border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-6 md:p-8 rounded-3xl hover:border-gray-600 hover:bg-gray-900/60 transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform">
                <User size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Digital Profil</h3>
              <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                Samla alla dina länkar på ett ställe. Perfekt för bio-länkar på Instagram och TikTok.
              </p>
              <div className="space-y-3 mb-6">
                <Feature text="Anpassad länk" />
                <Feature text="Profilbild & Bio" />
                <Feature text="Obegränsade länkar" />
                <Feature text="Grundläggande teman" />
              </div>
              <Link 
                href="/register" 
                className="w-full py-3.5 rounded-xl border border-gray-700 hover:bg-white hover:text-black transition-all font-medium text-sm flex items-center justify-center gap-2 mt-auto"
              >
                Skapa gratis konto
              </Link>
            </div>
          </div>

          {/* 2. PREMIUM */}
          <div className="min-w-[85vw] md:min-w-[50vw] lg:min-w-0 snap-center flex flex-col h-full pt-4 lg:pt-0">
            <div className="group border border-blue-500/30 bg-blue-950/10 backdrop-blur-sm p-6 md:p-8 rounded-3xl relative flex flex-col shadow-2xl shadow-blue-900/20 lg:-translate-y-6 h-full">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg whitespace-nowrap z-10">
                Mest Populär
              </div>
              
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-5 text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-blue-600/30">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">
                 {premiumProduct ? premiumProduct.name.replace("AvyraCards ", "") : "Premium"}
              </h3>
              <p className="text-blue-200/70 text-sm mb-6 flex-grow leading-relaxed">
                {premiumProduct?.description || "För kreatörer och företag som vill växa och analysera sin trafik."}
              </p>
              
              <div className="space-y-3 mb-6">
                <Feature text="Allt i gratis, plus:" highlight />
                {premiumFeatures.map((feat: string, i: number) => (
                    <Feature key={i} text={feat} highlight />
                ))}
              </div>

              <Link 
                href="/checkout/premium" 
                className="w-full py-3.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 mt-auto"
              >
                Bli medlem <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* 3. NFC KORT */}
          <div className="min-w-[85vw] md:min-w-[50vw] lg:min-w-0 snap-center flex flex-col h-full">
            <div className="group border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-6 md:p-8 rounded-3xl hover:border-white/30 hover:bg-gray-900/60 transition-all duration-300 flex flex-col h-full">
              <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CreditCard size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">NFC Kort</h3>
              <p className="text-gray-400 text-sm mb-6 flex-grow leading-relaxed">
                 {physicalProduct?.description || "Ditt digitala visitkort i fysisk form. Blip mot en telefon för att dela din profil direkt."}
              </p>
              
              <div className="space-y-3 mb-6">
                {physicalFeatures.map((feat: string, i: number) => (
                    <Feature key={i} text={feat} />
                ))}
                {physicalFeatures.length < 3 && <Feature text="Koppla till valfri profil" />}
              </div>

              <Link 
                href="/order" 
                className="w-full py-3.5 rounded-xl bg-white text-black hover:bg-gray-200 transition-all font-medium text-sm flex items-center justify-center gap-2 mt-auto"
              >
                Beställ kort
              </Link>
            </div>
          </div>

        </div>

        {/* Mobile Dots Indicator */}
        <div className="flex justify-center gap-2 mt-4 lg:hidden">
          {[0, 1, 2].map((i) => (
            <div 
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeSlide === i ? "bg-white w-6" : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        
        {/* Footer Link */}
        <div className="text-center mt-8 lg:mt-16 text-sm text-gray-500">
          Redan medlem? <Link href="/login" className="text-white hover:underline transition-all">Logga in här</Link>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 rounded-full p-1 flex-shrink-0 ${highlight ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
        <Check size={10} />
      </div>
      <span className={`text-sm leading-tight ${highlight ? "text-gray-200" : "text-gray-400"}`}>{text}</span>
    </div>
  );
}