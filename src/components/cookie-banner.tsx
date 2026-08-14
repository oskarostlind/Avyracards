"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useT } from "@/i18n/client";

export default function CookieBanner() {
  const t = useT();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Kolla om ett val redan är gjort
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "granted");
    setShowBanner(false);
    // Ladda om för att aktivera scripten direkt (enkelt sätt)
    window.location.reload();
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "denied");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-700">
      <div className="flex flex-col gap-4 rounded-2xl border border-nordic-highlight/40 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-100">
            {t("cookies.title")}
          </h3>
          <p className="text-xs text-nordic-highlight max-w-md">
            {t("cookies.bodyBefore")}{" "}
            <Link href="/privacy" className="underline hover:text-slate-200">
              {t("cookies.policyLinkText")}
            </Link>
            {t("cookies.bodyAfter")}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={declineCookies}
            className="rounded-lg border border-nordic-highlight/40 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            {t("cookies.decline")}
          </button>
          <button
            onClick={acceptCookies}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-nordic-secondary hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
          >
            {t("cookies.acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}