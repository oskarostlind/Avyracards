"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { IosApplePayCheckout } from "@/components/checkout/ios-apple-pay-checkout";

interface OrderItemPayload {
  variantId: string;
  quantity: number;
  color?: string;
  design?: string;
  material?: string;
  customPrintUrl?: string | null;
}

interface IosOrderCheckoutProps {
  items: OrderItemPayload[];
  premiumOption: "none" | "1mo" | "6mo";
  isPremium: boolean;
}

export function IosOrderCheckout({
  items,
  premiumOption,
  isPremium,
}: IosOrderCheckoutProps) {
  const [iapCompleted, setIapCompleted] = useState(
    premiumOption !== "6mo" || isPremium
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const purchaseSixMonthPremium = async () => {
    setLoading(true);
    setError("");

    try {
      const configResponse = await fetch("/api/apple/iap/config");
      const config = (await configResponse.json()) as {
        products: { sixMonths: string | null };
      };

      if (!config.products.sixMonths) {
        throw new Error("6-månaders IAP-produkt saknas");
      }

      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: config.products.sixMonths,
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
        throw new Error("Kunde inte verifiera premiumköpet");
      }

      setIapCompleted(true);
    } catch (err) {
      console.error(err);
      setError("Premiumköpet kunde inte slutföras.");
    } finally {
      setLoading(false);
    }
  };

  if (premiumOption === "6mo" && !isPremium && !iapCompleted) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-nordic-highlight text-center">
          6 månaders premium köps via App Store innan kortet betalas med Apple Pay.
        </p>
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={purchaseSixMonthPremium}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Köp 6 mån premium (App Store)"}
        </button>
      </div>
    );
  }

  return (
    <IosApplePayCheckout
      items={items}
      premiumOption={premiumOption === "6mo" ? "none" : premiumOption}
    />
  );
}
