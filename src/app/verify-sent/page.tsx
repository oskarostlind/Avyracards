"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Suspense } from "react";

// Vi använder Suspense eftersom vi läser searchParams (session_id) vilket är dynamiskt i Next.js
export default function VerifySentPage() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500">
          <CheckCircle size={40} />
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Tack för din beställning!</h1>
        <p className="text-gray-600 mb-10 leading-relaxed">
          Ditt AvyraCards produceras nu och skickas inom kort. En orderbekräftelse har skickats till din e-post.
        </p>

        <div className="bg-blue-50 p-6 rounded-2xl mb-8 border border-blue-100 text-left">
          <h3 className="font-bold text-blue-900 mb-2 text-lg">Vad händer nu?</h3>
          <p className="text-sm text-blue-700/80 mb-6">
            För att du ska vara redo när kortet landar i brevlådan rekommenderar vi att du skapar din profil redan nu.
          </p>
          <Link 
            href="/register" 
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Skapa din profil nu <ArrowRight size={16} />
          </Link>
        </div>

        <Link href="/" className="text-sm text-gray-400 hover:text-black transition-colors">
          Gå till startsidan
        </Link>
      </div>
    </div>
  );
}
