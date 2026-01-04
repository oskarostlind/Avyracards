"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { CreditCard, ArrowRight, LogIn } from "lucide-react";

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-nordic-secondary">Laddar...</div>}>
      <ActivateContent />
    </Suspense>
  );
}

function ActivateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlCode = searchParams.get("code");
  const claimToken = searchParams.get("token");

  const [inputCode, setInputCode] = useState("");

  const activeCode = urlCode || inputCode;

  if (!urlCode) {
    return (
      <div className="min-h-screen bg-nordic-primary text-nordic-secondary flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-nordic-primary/80 border border-nordic-highlight/40 p-8 rounded-3xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-nordic-primary text-nordic-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-nordic-accent/10 border border-nordic-highlight/40">
            <CreditCard size={32} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Aktivera kort</h1>
          <p className="text-nordic-highlight text-center mb-8 text-sm">
            Skriv in den 6-siffriga koden som står tryckt på ditt kort.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputCode.length > 0) {
                router.push(`/activate?code=${inputCode}`);
              }
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="text"
                placeholder="T.ex. X9F2P1"
                className="w-full text-center text-2xl font-mono tracking-widest uppercase py-4 bg-nordic-primary border border-nordic-highlight/40 rounded-xl focus:ring-2 focus:ring-nordic-accent/60 focus:border-transparent outline-none transition-all placeholder:text-nordic-highlight/60"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={inputCode.length < 3}
              className="w-full py-4 bg-nordic-secondary text-nordic-primary font-bold rounded-xl hover:bg-nordic-support transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Fortsätt <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const callbackPath = `/activate/confirm?code=${activeCode}&token=${claimToken || ""}`;
  const encodedCallback = encodeURIComponent(callbackPath);

  return (
    <div className="min-h-screen bg-nordic-primary text-nordic-secondary flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-nordic-primary/80 border border-nordic-highlight/40 p-8 rounded-3xl backdrop-blur-sm">
        <div className="w-16 h-16 bg-nordic-secondary text-nordic-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-white/10">
          <CreditCard size={32} />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Aktivera ditt AvyraCards</h1>
        <p className="text-nordic-highlight text-center mb-8 text-sm">
          Du håller i kortet <strong className="text-nordic-secondary font-mono">{activeCode}</strong>. <br />
          Koppla det till en profil för att komma igång.
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push(`/login?callbackUrl=${encodedCallback}`)}
            className="w-full py-4 bg-nordic-secondary text-nordic-primary font-bold rounded-xl hover:bg-nordic-support transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            Jag har redan ett konto
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-nordic-highlight/40" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#020617] px-2 text-nordic-secondary">Eller</span>
            </div>
          </div>

          <Link
            href={`/register?cardCode=${activeCode}&claimToken=${claimToken || ""}`}
            className="w-full py-4 bg-nordic-accent text-nordic-primary font-medium rounded-xl hover:bg-nordic-accent/80 transition-all flex items-center justify-center gap-2 border border-nordic-accent/50"
          >
            Skapa nytt konto <ArrowRight size={18} />
          </Link>
        </div>

        <p className="text-center text-xs text-nordic-highlight mt-8">
          Genom att aktivera kortet godkänner du våra villkor.
        </p>
      </div>
    </div>
  );
}
