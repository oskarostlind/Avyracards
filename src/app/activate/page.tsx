"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { CreditCard, ArrowRight, LogIn } from "lucide-react"; // Tog bort Loader2

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Laddar...</div>}>
      <ActivateContent />
    </Suspense>
  );
}

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const cardCode = searchParams.get("code");
  const claimToken = searchParams.get("token");

  // Tog bort loading/error states härifrån då de inte används i valet
  
  if (!cardCode) {
    return <div className="p-10 text-center">Ingen kortkod angiven.</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900/50 border border-gray-800 p-8 rounded-3xl backdrop-blur-sm">
        
        <div className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/10">
          <CreditCard size={32} />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Aktivera ditt SocialCard</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">
          Du håller i kortet <strong>{cardCode}</strong>. Koppla det till en profil för att komma igång.
        </p>

        <div className="space-y-4">
          {/* Alternativ 1: Jag har redan konto */}
          <button
             onClick={() => router.push(`/login?callbackUrl=/activate/confirm?code=${cardCode}&token=${claimToken}`)}
             className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Jag har redan ett konto
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0a] px-2 text-gray-500">Eller</span>
            </div>
          </div>

          {/* Alternativ 2: Ny användare */}
          <Link
            href={`/register?cardCode=${cardCode}&claimToken=${claimToken}`}
            className="w-full py-4 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition-all flex items-center justify-center gap-2 border border-gray-700"
          >
            Skapa nytt konto <ArrowRight size={18} />
          </Link>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-8">
          Genom att aktivera kortet godkänner du våra villkor.
        </p>
      </div>
    </div>
  );
}