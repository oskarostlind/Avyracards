"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { IosApplePayCheckout } from "@/components/checkout/ios-apple-pay-checkout";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";
import { isIosDebugEnabled } from "@/lib/ios-native";
import type { IosPremiumProductKey } from "@/lib/ios-native";
import { useT } from "@/i18n/client";

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
  /** "1moIap" = löpande månadsprenumeration, köps via StoreKit precis som "6mo". */
  premiumOption: "none" | "1mo" | "1moIap" | "6mo";
  isPremium: boolean;
}

export function IosOrderCheckout({
  items,
  premiumOption,
  isPremium,
}: IosOrderCheckoutProps) {
  const t = useT();
  // Både månads- och 6-månadersvalet är digitala prenumerationer och måste
  // därför gå via IAP innan kortordern betalas (Guideline 3.1.1).
  const needsIap = premiumOption === "6mo" || premiumOption === "1moIap";
  const iapProductKey: IosPremiumProductKey =
    premiumOption === "1moIap" ? "monthly" : "sixMonths";
  const planLabel =
    premiumOption === "1moIap" ? t("checkout.planMonthly") : t("checkout.planSixMonths");
  const [iapCompleted, setIapCompleted] = useState(!needsIap || isPremium);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const purchasePremium = async () => {
    setLoading(true);
    setError("");

    try {
      logIosNativeRuntime({
        scope: "IAP_ORDER",
        location: "ios-order-checkout.tsx:premium",
        message: "Starting premium IAP before Apple Pay",
        data: { productKey: iapProductKey },
      });

      const configResponse = await fetch("/api/apple/iap/config");
      const config = (await configResponse.json()) as {
        products: { monthly: string | null; sixMonths: string | null };
      };

      const productId = config.products[iapProductKey];

      if (!productId) {
        throw new Error(
          iapProductKey === "monthly"
            ? t("checkout.monthlyMissing")
            : t("checkout.sixMonthMissing")
        );
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
        throw new Error(t("checkout.verifyPremiumFailed"));
      }

      setIapCompleted(true);
      logIosNativeRuntime({
        scope: "IAP_ORDER",
        location: "ios-order-checkout.tsx:premium",
        message: "Premium IAP completed",
        data: { productKey: iapProductKey },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logIosNativeRuntime({
        scope: "IAP_ORDER",
        location: "ios-order-checkout.tsx:catch",
        message: "Premium IAP failed",
        data: { error: message },
        level: "error",
      });
      console.error(err);
      setError(isIosDebugEnabled() ? message : t("checkout.premiumFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (needsIap && !isPremium && !iapCompleted) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-nordic-highlight text-center">
          {t("checkout.iapBeforeApplePay", { plan: planLabel })}
        </p>
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={purchasePremium}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            t("checkout.iapBuyPlan", { plan: planLabel })
          )}
        </button>
      </div>
    );
  }

  // Guideline 3.1.1: prenumerationerna ("6mo"/"1moIap") har redan köpts via
  // StoreKit ovan, och "1mo" (startpaketets gratismånad) får aldrig levereras
  // via kortbetalningen i appen — ordern skickas därför alltid utan digitalt
  // premiumtillägg.
  return <IosApplePayCheckout items={items} premiumOption="none" />;
}
