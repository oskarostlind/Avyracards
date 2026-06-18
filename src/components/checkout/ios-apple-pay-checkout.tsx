"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Stripe, ApplePayEventsEnum } from "@capacitor-community/stripe";
import { logIosDebug } from "@/lib/ios-native-client-debug";

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

      logIosDebug("APPLE_PAY", "PaymentIntent created", {
        amountTotal: paymentIntent.amountTotal,
        summaryCount: paymentIntent.summaryItems.length,
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
        allowedCountries: ["SE", "NO", "DK", "FI", "DE"],
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

      onSuccess?.();
      window.location.href = "/dashboard?order=success";
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Apple Pay misslyckades. Försök igen."
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
