"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { CreditCard, ArrowRight, LogIn } from "lucide-react";

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white">Laddar...</div>}>
      <ActivateContent />
    </Suspense>
  );
}

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Hämta koden från URL, eller state om användaren skriver in den
  const urlCode = searchParams.get("code");
  const claimToken = searchParams.get("token");
  
  const [inputCode, setInputCode] = useState("");

  // Om vi har en kod (antingen från URL eller inmatad)
  const activeCode = urlCode || inputCode;
  
  // VYN: Om ingen kod finns i URL, visa inmatningsfält
  if (!urlCode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-slate-800 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/10">
            <CreditCard size={32} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Aktivera kort</h1>
          <p className="text-slate-400 text-center mb-8 text-sm">
            Skriv in den 6-siffriga koden som står tryckt på ditt kort.
          </p>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (inputCode.length > 0) {
                // Ladda om sidan med koden i URL:en
                router.push(`/activate?code=${inputCode}`);
              }
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="text"
                placeholder="T.ex. X9F2P1"
                className="w-full text-center text-2xl font-mono tracking-widest uppercase py-4 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder:text-slate-700"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={inputCode.length < 3}
              className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fortsätt <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VYN: Om kod finns, visa valen (Logga in / Skapa konto)
  // VIKTIGT: Vi måste URL-koda callbackUrl för att den ska överleva resan genom login-sidan
  const callbackPath = `/activate/confirm?code=${activeCode}&token=${claimToken || ""}`;
  const encodedCallback = encodeURIComponent(callbackPath);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-sm">
        
        <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/10">
          <CreditCard size={32} />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Aktivera ditt SocialCard</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Du håller i kortet <strong className="text-white font-mono">{activeCode}</strong>. <br/>
          Koppla det till en profil för att komma igång.
        </p>

        <div className="space-y-4">
          {/* Alternativ 1: Jag har redan konto -> Gå till Login -> Callback till Confirm */}
          <button
             onClick={() => router.push(`/login?callbackUrl=${encodedCallback}`)}
             className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Jag har redan ett konto
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#020617] px-2 text-slate-500">Eller</span>
            </div>
          </div>

          {/* Alternativ 2: Ny användare -> Register -> (Måste hantera redirect i register-flow separat, men vi skickar med params) */}
          <Link
            href={`/register?cardCode=${activeCode}&claimToken=${claimToken || ""}`}
            className="w-full py-4 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            Skapa nytt konto <ArrowRight size={18} />
          </Link>
        </div>
        
        <p className="text-center text-xs text-slate-600 mt-8">
          Genom att aktivera kortet godkänner du våra villkor.
        </p>
      </div>
    </div>
  );
}