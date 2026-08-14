"use client";

import Link from "next/link";
import { Check, Sparkles, LayoutDashboard, Package, MapPin, Clock, Loader2 } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useT, useLocaleTag } from "@/i18n/client";
import type { Translator } from "@/i18n";

interface OrderDetails {
  id: string;
  status: "PENDING" | "PAID" | "FAILED" | "SHIPPED";
  createdAt: string;
  amountTotal: number;
  currency: string;
  checkoutSource: string | null;
  shipping: {
    name: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    postalCode: string | null;
    country: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    productName: string;
    variantName: string;
  }>;
  cardCount: number;
}

const STATUS_STYLES: Record<OrderDetails["status"], { labelKey: string; className: string }> = {
  PENDING: { labelKey: "orderSuccess.status.pending", className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  PAID: { labelKey: "orderSuccess.status.paid", className: "bg-green-500/10 text-green-400 border-green-500/30" },
  FAILED: { labelKey: "orderSuccess.status.failed", className: "bg-red-500/10 text-red-400 border-red-500/30" },
  SHIPPED: { labelKey: "orderSuccess.status.shipped", className: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
};

// Beloppet formateras efter valt språk, inte hårdkodat sv-SE: "299,00 kr"
// respektive "SEK 299.00". Valutan kommer fortfarande från ordern.
function formatAmount(amountOre: number, currency: string, localeTag: string) {
  return new Intl.NumberFormat(localeTag, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountOre / 100);
}

export default function VerifySentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030712]" aria-busy="true" />}>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const t = useT();
  const localeTag = useLocaleTag();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [status, setStatus] = useState<"loading" | "found" | "pending" | "none">(
    sessionId ? "loading" : "none"
  );

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 8;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(sessionId)}`);
        if (cancelled) return;

        if (res.ok) {
          const data = (await res.json()) as OrderDetails;
          setOrder(data);
          setStatus("found");
          return;
        }

        if (res.status === 404 && attempts < MAX_ATTEMPTS) {
          setTimeout(poll, 1500);
          return;
        }

        setStatus(res.status === 404 ? "pending" : "none");
      } catch {
        if (!cancelled) setStatus("pending");
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const statusMeta = order ? STATUS_STYLES[order.status] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] p-4 py-12 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="bg-[#0A0F1C] p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-800 max-w-lg w-full relative z-10 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-full h-full bg-green-500/10 text-green-400 rounded-full flex items-center justify-center border border-green-500/30">
            <Check size={48} strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{t("orderSuccess.title")}</h1>
        <p className="text-nordic-highlight mb-8 leading-relaxed text-lg">
          Tack för din beställning. En bekräftelse har skickats till din e-post och ditt kvitto finns sparat.
        </p>

        {/* Orderstatus-box */}
        {sessionId && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl mb-8 border border-gray-800 text-left">
            {status === "loading" && (
              <div className="flex items-center gap-3 text-nordic-highlight py-2">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">{t("orderSuccess.loadingOrder")}</span>
              </div>
            )}

            {status === "pending" && (
              <div className="flex items-center gap-3 text-amber-400 py-2">
                <Clock size={18} />
                <span className="text-sm">{t("orderSuccess.pending")}</span>
              </div>
            )}

            {status === "found" && order && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Package size={18} className="text-nordic-accent" />
                    {t("orderSuccess.yourOrder")}
                  </h3>
                  {statusMeta && (
                    <span
                      className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${statusMeta.className}`}
                    >
                      {t(statusMeta.labelKey)}
                    </span>
                  )}
                </div>

                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm text-nordic-highlight">
                      <span>
                        {item.quantity}× {item.productName}
                        {item.variantName ? ` (${item.variantName})` : ""}
                      </span>
                      <span className="text-white font-mono">
                        {formatAmount(item.price * item.quantity, order.currency, localeTag)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-between items-center pt-3 border-t border-gray-800">
                  <span className="text-sm text-nordic-highlight">{t("orderSuccess.total")}</span>
                  <span className="text-white font-bold font-mono">
                    {formatAmount(order.amountTotal, order.currency, localeTag)}
                  </span>
                </div>

                {order.cardCount > 0 && (
                  <p className="text-xs text-nordic-highlight">
                    {t("orderSuccess.cardsBeingMade", { count: order.cardCount })}
                  </p>
                )}

                {order.shipping.line1 && (
                  <div className="flex items-start gap-2 text-xs text-nordic-highlight pt-3 border-t border-gray-800">
                    <MapPin size={14} className="mt-0.5 shrink-0" />
                    <span>
                      {order.shipping.name && <>{order.shipping.name}<br /></>}
                      {order.shipping.line1}
                      {order.shipping.line2 && <>, {order.shipping.line2}</>}
                      <br />
                      {order.shipping.postalCode} {order.shipping.city}, {order.shipping.country}
                    </span>
                  </div>
                )}
              </div>
            )}

            {status === "none" && (
              <p className="text-sm text-nordic-highlight py-2">
                {t("orderSuccess.notFound")}
              </p>
            )}
          </div>
        )}

        {/* Nästa steg-box */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-2xl mb-8 border border-gray-800 text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={80} />
          </div>

          <h3 className="font-bold text-white mb-2 text-lg flex items-center gap-2">
            <Sparkles size={18} className="text-nordic-accent" />
            {t("orderSuccess.nextStepTitle")}
          </h3>
          <p className="text-sm text-nordic-highlight mb-6 leading-relaxed">
            {t("orderSuccess.nextStepBody")}
          </p>

          <Link
            href="/dashboard"
            className="w-full py-4 bg-nordic-secondary text-nordic-primary rounded-xl font-bold hover:bg-nordic-support transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <LayoutDashboard size={18} /> {t("orderSuccess.goToDashboard")}
          </Link>
        </div>

        <div className="text-xs text-gray-600">
          {t("orderSuccess.orderId")} <span className="font-mono text-gray-500">{sessionId ? sessionId.slice(-8) : "..."}</span>
        </div>
      </div>
    </div>
  );
}
