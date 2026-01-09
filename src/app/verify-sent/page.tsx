"use client";

import Link from "next/link";
import { Check, Sparkles, LayoutDashboard } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifySentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712] flex items-center justify-center text-nordic-highlight">Laddar...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const searchParams = useSearchParams();
  // Vi kan använda session_id för att visa kvitto i framtiden om vi vill
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] p-4 text-center relative overflow-hidden">
      
      {/* Bakgrundseffekt */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-[#0A0F1C] p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-800 max-w-lg w-full relative z-10 animate-in slide-in-from-bottom-4 fade-in duration-700">
        
        {/* Ikon med animation */}
        <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-full h-full bg-green-500/10 text-green-400 rounded-full flex items-center justify-center border border-green-500/30">
                <Check size={48} strokeWidth={3} />
            </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Betalning godkänd!</h1>
        <p className="text-nordic-highlight mb-10 leading-relaxed text-lg">
          Tack för din beställning. En bekräftelse har skickats till din e-post och ditt kvitto finns sparat.
        </p>

        {/* Nästa steg-box */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl mb-8 border border-gray-800 text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Sparkles size={80} />
          </div>
          
          <h3 className="font-bold text-white mb-2 text-lg flex items-center gap-2">
            <Sparkles size={18} className="text-nordic-accent" />
            Dags att skapa magi
          </h3>
          <p className="text-sm text-nordic-highlight mb-6 leading-relaxed">
            Medan vi producerar ditt kort kan du börja designa din digitala profil. Allt du ändrar i Dashboarden uppdateras automatiskt på kortet.
          </p>
          
          <Link
            href="/dashboard"
            className="w-full py-4 bg-nordic-secondary text-nordic-primary rounded-xl font-bold hover:bg-nordic-support transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <LayoutDashboard size={18} /> Gå till min Dashboard
          </Link>
        </div>

        <div className="text-xs text-gray-600">
           Order ID: <span className="font-mono text-gray-500">{sessionId ? sessionId.slice(-8) : "..."}</span>
        </div>
      </div>
    </div>
  );
}