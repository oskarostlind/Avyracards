"use client";

import Link from "next/link";
import { Check, CreditCard, Sparkles, User, ArrowRight } from "lucide-react";

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full py-12">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Välj hur du vill synas
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Börja helt gratis, uppgradera för professionella verktyg eller ta ditt nätverkande till nästa nivå med våra NFC-kort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* 1. GRATIS PROFIL */}
          <div className="group border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-8 rounded-3xl hover:border-gray-600 hover:bg-gray-900/60 transition-all duration-300 flex flex-col">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
              <User size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Digital Profil</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Samla alla dina länkar på ett ställe. Perfekt för bio-länkar på Instagram och TikTok.
            </p>
            <div className="flex-grow space-y-4 mb-8">
              <Feature text="Anpassad länk" />
              <Feature text="Profilbild & Bio" />
              <Feature text="Obegränsade länkar" />
              <Feature text="Grundläggande teman" />
            </div>
            <Link 
              href="/register" 
              className="w-full py-4 rounded-xl border border-gray-700 hover:bg-white hover:text-black transition-all font-medium flex items-center justify-center gap-2"
            >
              Skapa gratis konto
            </Link>
          </div>

          {/* 2. PREMIUM */}
          <div className="group border border-blue-500/30 bg-blue-950/10 backdrop-blur-sm p-8 rounded-3xl relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-blue-900/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
              Mest Populär
            </div>
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-lg shadow-blue-600/30">
              <Sparkles size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-blue-200/60 text-sm mb-8 leading-relaxed">
              För kreatörer och företag som vill växa och analysera sin trafik.
            </p>
            <div className="flex-grow space-y-4 mb-8">
              <Feature text="Allt i gratis, plus:" highlight />
              <Feature text="Inga annonser" highlight />
              <Feature text="Avancerad statistik" highlight />
              <Feature text="Prioriterad support" highlight />
            </div>
            <Link 
              href="/register?plan=premium" 
              className="w-full py-4 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-all font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25"
            >
              Bli medlem <ArrowRight size={16} />
            </Link>
          </div>

          {/* 3. BESTÄLL KORT */}
          <div className="group border border-gray-800 bg-gray-900/40 backdrop-blur-sm p-8 rounded-3xl hover:border-white/30 hover:bg-gray-900/60 transition-all duration-300 flex flex-col">
            <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CreditCard size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-2">NFC Kort</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Ditt digitala visitkort i fysisk form. Blip mot en telefon för att dela din profil direkt.
            </p>
            <div className="flex-grow space-y-4 mb-8">
              <Feature text="Fysiskt NFC-kort (Plast/Metall)" />
              <Feature text="Ingen app krävs för mottagaren" />
              <Feature text="Livstids access" />
              <Feature text="Koppla till valfri profil" />
            </div>
            <Link 
              href="/order" 
              className="w-full py-4 rounded-xl bg-white text-black hover:bg-gray-200 transition-all font-medium flex items-center justify-center gap-2"
            >
              Beställ kort
            </Link>
          </div>

        </div>
        
        <div className="text-center mt-16 text-sm text-gray-500">
          Redan medlem? <Link href="/login" className="text-white hover:underline transition-all">Logga in här</Link>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, highlight = false }: { text: string; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-full p-1 flex-shrink-0 ${highlight ? "bg-blue-500/20 text-blue-400" : "bg-gray-800 text-gray-400"}`}>
        <Check size={12} />
      </div>
      <span className={`text-sm ${highlight ? "text-gray-200" : "text-gray-400"}`}>{text}</span>
    </div>
  );
}