"use client";

import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { NativePurchases } from "@capgo/native-purchases";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";

interface Props {
  className?: string;
  label?: string;
}

/**
 * Guideline 3.1.1 kräver att appar med icke-förbrukningsbara köp och
 * auto-förnyande prenumerationer har en synlig "återställ köp"-funktion.
 * Granskaren testar den med ett konto som redan har köpt — saknas knappen
 * är det ett garanterat avslag.
 *
 * Flödet: StoreKit återställer transaktionerna lokalt, vi läser dem med
 * getPurchases() och skickar varje transaktion till vår befintliga
 * verifieringsendpoint så att premium sätts på det inloggade kontot.
 */
export function IosRestorePurchasesButton({ className, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const handleRestore = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await NativePurchases.restorePurchases();

      const result = await NativePurchases.getPurchases();
      const transactions = result?.purchases ?? [];

      let restored = 0;
      for (const transaction of transactions) {
        if (!transaction?.transactionId) continue;

        const response = await fetch("/api/apple/iap/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: transaction.transactionId,
            environment: transaction.environment,
          }),
        });

        if (response.ok) restored += 1;
      }

      logIosNativeRuntime({
        scope: "IAP",
        location: "ios-restore-purchases-button.tsx:restore",
        message: "Restore finished",
        data: { found: transactions.length, restored },
      });

      if (restored > 0) {
        setMessage({ type: "ok", text: "Ditt köp är återställt." });
        window.location.href = "/dashboard";
        return;
      }

      setMessage({
        type: "err",
        text: "Vi hittade inga tidigare köp kopplade till ditt Apple-ID.",
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      logIosNativeRuntime({
        scope: "IAP",
        location: "ios-restore-purchases-button.tsx:catch",
        message: "Restore failed",
        data: { error: text },
        level: "error",
      });
      setMessage({ type: "err", text: "Kunde inte återställa köp. Försök igen." });
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
        {loading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : (
          <RotateCcw size={16} />
        )}
        {label ?? "Återställ köp"}
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
