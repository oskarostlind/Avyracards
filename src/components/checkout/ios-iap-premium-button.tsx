"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import type { IosPremiumProductKey } from "@/lib/ios-native";

interface IosIapPremiumButtonProps {
  productKey: IosPremiumProductKey;
  label: string;
  onSuccess?: () => void;
}

export function IosIapPremiumButton({
  productKey,
  label,
  onSuccess,
}: IosIapPremiumButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePurchase = async () => {
    setLoading(true);
    setError("");

    try {
      const configResponse = await fetch("/api/apple/iap/config");
      const config = (await configResponse.json()) as {
        products: { monthly: string | null; sixMonths: string | null };
      };

      const productId =
        productKey === "monthly" ? config.products.monthly : config.products.sixMonths;

      if (!productId) {
        throw new Error("IAP-produkt saknas i konfigurationen");
      }

      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: productId,
        productType: PURCHASE_TYPE.SUBS,
      });

      const verifyResponse = await fetch("/api/apple/iap/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: transaction.transactionId,
          environment: transaction.environment,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Kunde inte verifiera köpet");
      }

      onSuccess?.();
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Köpet kunde inte slutföras. Försök igen.");
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
