"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackageCheck, Wand2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

interface Props {
  orderId: string;
  currentStatus: OrderStatus;
  cardsGenerated: boolean;
}

export function AdminOrderActions({ orderId, currentStatus, cardsGenerated }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!confirm("Vill du generera nya koder och tokens för denna order?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/generate`, { method: "POST" });
      if (!res.ok) throw new Error("Fel vid generering");
      router.refresh();
    } catch (err) {
      alert("Kunde inte generera kort. Kolla serverloggen.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!confirm("Är du säker på att du skickat ordern?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SHIPPED" }),
      });
      if (!res.ok) throw new Error("Fel vid uppdatering");
      router.refresh();
    } catch (err) {
      alert("Kunde inte uppdatera status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {!cardsGenerated && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 border border-slate-700"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          Generera Koder
        </button>
      )}

      {currentStatus === "PAID" && (
        <button
          onClick={handleMarkShipped}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-blue-900/20"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <PackageCheck size={16} />}
          Markera som Skickad
        </button>
      )}
    </div>
  );
}