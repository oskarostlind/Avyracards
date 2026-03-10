"use client";

import { useState, useEffect } from "react";
import { Check, Copy, ExternalLink, Share2, Wallet } from "lucide-react";
import { Share } from "@capacitor/share";
import { Browser } from "@capacitor/browser";
import { useIsApp } from "@/hooks/useIsApp";

type PublicProfileCardProps = {
  username: string;
  className?: string;
};

export function PublicProfileCard({ username, className }: PublicProfileCardProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://avyracards.se");
  const isApp = useIsApp();

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

  const handleShare = async () => {
    try {
      await Share.share({
        title: "Min AvyraCards-profil",
        text: "Kolla in min profil på AvyraCards",
        url: fullUrl,
        dialogTitle: "Dela profil",
      });
    } catch (error) {
      // Användaren avbröt eller plugin saknas – fallback till kopiera
      console.warn("Share failed or cancelled, falling back to copy", error);
      copyToClipboard();
    }
  };

  const handleAppleWalletClick = async (e: React.MouseEvent) => {
    if (!isApp) return;
    e.preventDefault();
    const walletUrl = `${origin}/api/wallet/apple`;
    
    try {
      // _system tvingar appen att skicka filen till riktiga Safari/Apple Wallet
      await Browser.open({ url: walletUrl, windowName: '_system' });
    } catch (error) {
      console.error("Failed to open Apple Wallet link", error);
    }
  };

  return (
    <div className={`rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 ${className ?? ""}`}>
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

          {isApp ? (
            <button
              type="button"
              onClick={handleShare}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-nordic-secondary transition-colors border border-nordic-highlight/40"
              title="Dela profil"
            >
              <Share2 size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-nordic-secondary transition-colors border border-nordic-highlight/40"
              title="Kopiera länk"
            >
              {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
            </button>
          )}

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
          {isApp ? (
            <button
              type="button"
              onClick={handleAppleWalletClick}
              className="flex items-center justify-center gap-2 bg-[#1C1C1E] text-nordic-secondary border border-white/10 px-4 py-3 rounded-xl hover:bg-[#2C2C2E] transition-all font-medium text-xs sm:text-sm shadow-lg"
            >
              <Wallet size={16} className="text-nordic-secondary" />
              <span>Apple Wallet</span>
            </button>
          ) : (
            <a
              href="/api/wallet/apple"
              className="flex items-center justify-center gap-2 bg-[#1C1C1E] text-nordic-secondary border border-white/10 px-4 py-3 rounded-xl hover:bg-[#2C2C2E] transition-all font-medium text-xs sm:text-sm shadow-lg"
            >
              <Wallet size={16} className="text-nordic-secondary" />
              <span>Apple Wallet</span>
            </a>
          )}

          {/* Google Wallet */}
          <a
            href="/api/wallet/google"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-nordic-secondary text-nordic-primary border border-nordic-support px-4 py-3 rounded-xl hover:bg-nordic-support transition-all font-medium text-xs sm:text-sm shadow-lg"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.75 9.75H13.5V21H21.75C22.5784 21 23.25 20.3284 23.25 19.5V11.25C23.25 10.4216 22.5784 9.75 21.75 9.75Z" fill="#FBBC04"/>
              <path d="M12.75 21V9.75H4.5C3.67157 9.75 3 10.4216 3 11.25V19.5C3 20.3284 3.67157 21 4.5 21H12.75Z" fill="#EA4335"/>
              <path d="M12.75 3V9.75H21.75C22.2575 9.75 22.708 9.87703 23.1075 10.1006L16.2075 3.20062C15.27 2.26312 14.025 1.75687 12.75 1.75687V3Z" fill="#4285F4"/>
              <path d="M4.5 9.75H12.75V3L4.5 9.75Z" fill="#34A853"/>
            </svg>
            <span>Google Wallet</span>
          </a>
        </div>
      </div>
    </div>
  );
}