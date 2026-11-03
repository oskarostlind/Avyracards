"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import type { GooglePlayBillingConfig } from "@/hooks/useGooglePlayBilling";
import { useT } from "@/i18n/client";

interface Props {
  config: GooglePlayBillingConfig;
  label: string;
}

function isUserCancelled(message: string): boolean {
  return /cancel|avbr|USER_CANCELED/i.test(message);
}

/**
 * Köp av Premium i Android-appen via Google Play Billing. Speglar
 * IosIapPremiumButton: köpet görs i Play, purchaseToken verifieras sedan
 * server-side innan premium sätts.
 */
export function AndroidPlayPremiumButton({ config, label }: Props) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePurchase = async () => {
    if (!config.subscriptionId || !config.basePlanId) return;
    setLoading(true);
    setError("");

    try {
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: config.subscriptionId,
        planIdentifier: config.basePlanId,
        productType: PURCHASE_TYPE.SUBS,
      });

      if (!transaction.purchaseToken) {
        throw new Error("verify_failed");
      }

      const verifyResponse = await fetch("/api/google/play/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseToken: transaction.purchaseToken }),
      });

      if (verifyResponse.status === 409) {
        throw new Error("other_account");
      }
      if (!verifyResponse.ok) {
        throw new Error("verify_failed");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isUserCancelled(message)) {
        setLoading(false);
        return;
      }
      console.error("[PLAY_BILLING]", err);
      setError(
        message === "other_account"
          ? t("checkout.playOtherAccount")
          : message === "verify_failed"
            ? t("checkout.verifyFailed")
            : t("checkout.iapFailed")
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={handlePurchase}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-zinc-900 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : label}
      </button>
    </div>
  );
}
