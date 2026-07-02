"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Stripe, ApplePayEventsEnum } from "@capacitor-community/stripe";
import { isIosDebugEnabled } from "@/lib/ios-native";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";

interface SummaryItem {
  label: string;
  amount: number;
}

interface IosApplePayCheckoutProps {
  items: Array<{
    variantId: string;
    quantity: number;
    color?: string;
    design?: string;
    material?: string;
    customPrintUrl?: string | null;
  }>;
  premiumOption: "none" | "1mo" | "6mo";
  onSuccess?: () => void;
}

export function IosApplePayCheckout({
  items,
  premiumOption,
  onSuccess,
}: IosApplePayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApplePay = async () => {
    setLoading(true);
    setError("");

    try {
      logIosNativeRuntime({
        scope: "APPLE_PAY",
        location: "ios-apple-pay-checkout.tsx:start",
        message: "Starting Apple Pay flow",
        data: { itemCount: items.length, premiumOption },
      });

      const configResponse = await fetch("/api/apple/iap/config");
      const config = (await configResponse.json()) as {
        publishableKey: string | null;
        merchantId: string | null;
      };

      if (!config.publishableKey || !config.merchantId) {
        throw new Error("Apple Pay är inte konfigurerat ännu");
      }

      await Stripe.initialize({ publishableKey: config.publishableKey });

      const paymentIntentResponse = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, premiumOption }),
      });

      if (!paymentIntentResponse.ok) {
        const payload = (await paymentIntentResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "Kunde inte starta betalning");
      }

      const paymentIntent = (await paymentIntentResponse.json()) as {
        clientSecret: string;
        amountTotal: number;
        summaryItems: SummaryItem[];
      };

      logIosNativeRuntime({
        scope: "APPLE_PAY",
        location: "ios-apple-pay-checkout.tsx:paymentIntent",
        message: "PaymentIntent created",
        data: {
          amountTotal: paymentIntent.amountTotal,
          summaryCount: paymentIntent.summaryItems.length,
        },
      });

      const paymentSummaryItems = paymentIntent.summaryItems.map((item) => ({
        label: item.label,
        amount: item.amount / 100,
      }));

      await Stripe.createApplePay({
        paymentIntentClientSecret: paymentIntent.clientSecret,
        paymentSummaryItems,
        merchantIdentifier: config.merchantId,
        countryCode: "SE",
        currency: "SEK",
        requiredShippingContactFields: ["emailAddress", "phoneNumber", "postalAddress", "name"],
        // @capacitor-community/stripe's native iOS check lowercases the
        // entered address's ISO country code before comparing it against
        // this list, but never lowercases the list itself — so uppercase
        // codes here (the ISO 3166-1 convention) never match anything,
        // rejecting every country including the ones meant to be allowed.
        allowedCountries: ["se", "no", "dk", "fi", "de"],
      });

      const cancelListener = await Stripe.addListener(
        ApplePayEventsEnum.Canceled,
        async () => {
          setLoading(false);
          await cancelListener.remove();
        }
      );

      const result = await Stripe.presentApplePay();
      await cancelListener.remove();

      if (result.paymentResult !== ApplePayEventsEnum.Completed) {
        throw new Error("Betalningen avbröts");
      }

      logIosNativeRuntime({
        scope: "APPLE_PAY",
        location: "ios-apple-pay-checkout.tsx:success",
        message: "Apple Pay completed",
      });

      onSuccess?.();
      window.location.href = "/dashboard?order=success";
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logIosNativeRuntime({
        scope: "APPLE_PAY",
        location: "ios-apple-pay-checkout.tsx:catch",
        message: "Apple Pay failed",
        data: { error: message },
        level: "error",
      });
      console.error(err);
      setError(
        isIosDebugEnabled()
          ? message
          : err instanceof Error
            ? err.message
            : "Apple Pay misslyckades. Försök igen."
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
        onClick={handleApplePay}
        disabled={loading}
        className="w-full py-4 rounded-xl bg-black text-white font-bold hover:bg-zinc-900 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : "Betala med Apple Pay"}
      </button>
    </div>
  );
}
