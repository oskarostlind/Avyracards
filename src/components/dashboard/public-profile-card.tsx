"use client";

import { useState, useEffect } from "react"; // La till useEffect
import { Check, Copy, ExternalLink, Wallet } from "lucide-react";

type PublicProfileCardProps = {
  username: string;
  className?: string;
};

export function PublicProfileCard({ username, className }: PublicProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [walletLoading, setWalletLoading] = useState<"apple" | "google" | null>(null);
  // Vi sätter ett startvärde som är säkert för servern (undviker hydration error)
  const [origin, setOrigin] = useState("https://avyracards.se");

  // Uppdatera till den faktiska adressen när komponenten laddats på klienten
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicPath = `/u/${username}`;
  const fullUrl = `${origin}${publicPath}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Passen öppnas i systemwebbläsaren (target="_blank") för att PassKit/Google
  // Wallet-hanteringen ska triggas korrekt, men den delar inte Capacitor-
  // WebViewens sessionscookie. Hämta därför en kortlivad access-token via ett
  // fetch-anrop (som fortfarande har cookien) innan vi öppnar länken.
  const openWallet = async (kind: "apple" | "google") => {
    setWalletLoading(kind);
    try {
      const res = await fetch("/api/wallet/token");
      const data = (await res.json()) as { token?: string };
      const url = data.token
        ? `/api/wallet/${kind}?token=${encodeURIComponent(data.token)}`
        : `/api/wallet/${kind}`;
      window.open(url, "_blank");
    } catch (err) {
      console.error("Kunde inte öppna plånbok", err);
      window.open(`/api/wallet/${kind}`, "_blank");
    } finally {
      setWalletLoading(null);
    }
  };

  return (
    <div className={`rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
          Din publika profil
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {/* Rad 1: URL och Verktyg */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 rounded-xl border border-nordic-highlight/40 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 font-mono truncate">
            {fullUrl}
          </div>
          
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-nordic-secondary transition-colors border border-nordic-highlight/40"
            title="Kopiera länk"
          >
            {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          </button>
          
          <a
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-nordic-secondary transition-colors border border-nordic-highlight/40"
            title="Öppna profil i ny flik"
          >
            <ExternalLink size={18} />
          </a>
        </div>

        {/* Rad 2: Plånböcker */}
        <div className="grid grid-cols-2 gap-2">
           {/* Apple Wallet */}
           <button
             type="button"
             onClick={() => void openWallet("apple")}
             disabled={walletLoading === "apple"}
             className="flex items-center justify-center gap-2 bg-[#1C1C1E] text-nordic-secondary border border-white/10 px-4 py-3 rounded-xl hover:bg-[#2C2C2E] transition-all font-medium text-xs sm:text-sm shadow-lg disabled:opacity-50"
           >
             <Wallet size={16} className="text-nordic-secondary" />
             <span>Apple Wallet</span>
           </button>

           {/* Google Wallet */}
           <button
             type="button"
             onClick={() => void openWallet("google")}
             disabled={walletLoading === "google"}
             className="flex items-center justify-center gap-2 bg-nordic-secondary text-nordic-primary border border-nordic-support px-4 py-3 rounded-xl hover:bg-nordic-support transition-all font-medium text-xs sm:text-sm shadow-lg disabled:opacity-50"
           >
             {/* Google Wallet Icon SVG */}
             <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M21.75 9.75H13.5V21H21.75C22.5784 21 23.25 20.3284 23.25 19.5V11.25C23.25 10.4216 22.5784 9.75 21.75 9.75Z" fill="#FBBC04"/>
               <path d="M12.75 21V9.75H4.5C3.67157 9.75 3 10.4216 3 11.25V19.5C3 20.3284 3.67157 21 4.5 21H12.75Z" fill="#EA4335"/>
               <path d="M12.75 3V9.75H21.75C22.2575 9.75 22.708 9.87703 23.1075 10.1006L16.2075 3.20062C15.27 2.26312 14.025 1.75687 12.75 1.75687V3Z" fill="#4285F4"/>
               <path d="M4.5 9.75H12.75V3L4.5 9.75Z" fill="#34A853"/>
             </svg>
             <span>Google Wallet</span>
           </button>
        </div>
      </div>
    </div>
  );
}