"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import type { GooglePlayBillingConfig } from "@/hooks/useGooglePlayBilling";
import { useT } from "@/i18n/client";

interface Props {
  config: GooglePlayBillingConfig;
  className?: string;
}

/**
 * "Återställ köp" i Android-appen: hämtar Premium-prenumerationen från
 * Google Play-kontot på enheten och verifierar den mot vår server, så att
 * premium sätts på det inloggade kontot (t.ex. efter ny installation).
 */
export function AndroidRestorePurchasesButton({ config, className }: Props) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleRestore = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await NativePurchases.restorePurchases().catch(() => {});
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.SUBS,
      });
      const latest = (purchases ?? [])
        .filter((p) => p.productIdentifier === config.subscriptionId && p.purchaseToken)
        .sort((a, b) => (b.purchaseDate ?? "").localeCompare(a.purchaseDate ?? ""))[0];

      if (!latest?.purchaseToken) {
        setMessage({ type: "err", text: t("checkout.nothingToRestoreGoogle") });
        return;
      }

      const response = await fetch("/api/google/play/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseToken: latest.purchaseToken }),
      });

      if (response.status === 409) {
        setMessage({ type: "err", text: t("checkout.playOtherAccount") });
        return;
      }
      if (!response.ok) {
        setMessage({ type: "err", text: t("checkout.restoreFailed") });
        return;
      }

      const data = (await response.json()) as { active?: boolean };
      if (!data.active) {
        setMessage({ type: "err", text: t("checkout.playSubscriptionInactive") });
        return;
      }

      setMessage({ type: "ok", text: t("checkout.restored") });
      window.location.href = "/dashboard";
    } catch {
      setMessage({ type: "err", text: t("checkout.restoreFailed") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRestore}
        disabled={loading}
        className={
          className ??
          "w-full py-3 rounded-xl border border-white/20 text-sm font-medium text-slate-200 hover:bg-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
        }
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : <RotateCcw size={16} />}
        {t("checkout.restoreLabel")}
      </button>
      {message && (
        <p
          className={`text-xs text-center ${
            message.type === "ok" ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
