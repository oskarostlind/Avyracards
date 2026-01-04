"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Suspense } from "react";

export default function VerifySentPage() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 text-center">
      <div className="bg-nordic-primary p-8 md:p-12 rounded-3xl shadow-xl border border-nordic-support max-w-lg w-full">
        <div className="w-20 h-20 bg-nordic-secondary/10 text-nordic-accent rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500 border border-nordic-highlight/40">
          <CheckCircle size={40} />
        </div>

        <h1 className="text-3xl font-bold mb-4 text-nordic-secondary">Tack för din beställning!</h1>
        <p className="text-nordic-highlight mb-10 leading-relaxed">
          Ditt AvyraCards produceras nu och skickas inom kort. En orderbekräftelse har skickats till din e-post.
        </p>

        <div className="bg-nordic-primary/70 p-6 rounded-2xl mb-8 border border-nordic-highlight/40 text-left backdrop-blur-sm">
          <h3 className="font-bold text-nordic-secondary mb-2 text-lg">Vad händer nu?</h3>
          <p className="text-sm text-nordic-highlight mb-6">
            För att du ska vara redo när kortet landar i brevlådan rekommenderar vi att du skapar din profil redan nu.
          </p>
          <Link
            href="/register"
            className="w-full py-3 bg-nordic-accent text-nordic-primary rounded-xl font-medium hover:bg-nordic-accent/80 transition-colors flex items-center justify-center gap-2"
          >
            Skapa din profil nu <ArrowRight size={16} />
          </Link>
        </div>

        <Link href="/" className="text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors">
          Gå till startsidan
        </Link>
      </div>
    </div>
  );
}
