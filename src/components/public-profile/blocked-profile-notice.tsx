"use client";

import { useState } from "react";
import { Ban, Loader2 } from "lucide-react";
import { useT } from "@/i18n/client";

/**
 * Vyn en användare får när hen öppnar en profil hen själv har blockerat.
 * Guideline 1.2 kräver att blockeringen faktiskt får effekt på innehållet —
 * det räcker inte att spara flaggan i databasen.
 */
export function BlockedProfileNotice({ username }: { username: string }) {
  const t = useT();
  const [loading, setLoading] = useState(false);

  const unblock = async () => {
    setLoading(true);
    await fetch("/api/block", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#030712] text-slate-200 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400">
          <Ban size={26} />
        </div>
        <h1 className="text-xl font-semibold">{t("moderation.blockedTitle", { username })}</h1>
        <p className="text-sm text-slate-400">
          {t("moderation.blockedBody")}
        </p>
        <button
          type="button"
          onClick={unblock}
          disabled={loading}
          className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium hover:bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {t("moderation.unblockButton")}
        </button>
        <a
          href="/"
          className="block text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300"
        >
          {t("moderation.toHome")}
        </a>
      </div>
    </main>
  );
}
