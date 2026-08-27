"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Loader2, X } from "lucide-react";
import { useT } from "@/i18n/client";

interface Props {
  /** Aktiva fysiska varianter — serialiserbara, hämtas i serverkomponenten. */
  variants: { id: string; name: string }[];
  /** Förifyll mottagarens e-post (t.ex. från en användarsida i admin). */
  defaultEmail?: string;
  /** Förifyll användarnamn så korten kopplas till det kontot direkt. */
  defaultUsername?: string;
}

export function GiftOrderForm({ variants, defaultEmail, defaultUsername }: Props) {
  const t = useT();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail ?? "");
  const [username, setUsername] = useState(defaultUsername ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId,
          quantity,
          customerEmail: customerEmail.trim(),
          username: username.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || t("admin.giftOrder.failed"));
        return;
      }
      router.push(`/admin/orders/${data.orderId}`);
    } catch {
      setError(t("admin.giftOrder.failed"));
    } finally {
      setLoading(false);
    }
  };

  if (variants.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-nordic-secondary transition hover:bg-purple-500"
      >
        <Gift size={16} />
        {t("admin.giftOrder.openButton")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-5 md:w-[380px]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Gift size={16} className="text-purple-400" />
            {t("admin.giftOrder.title")}
          </h2>
          <p className="mt-1 text-xs text-nordic-highlight">
            {t("admin.giftOrder.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-nordic-highlight transition hover:text-slate-200"
          aria-label={t("admin.giftOrder.close")}
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label
            htmlFor="gift-variant"
            className="mb-1 block text-xs text-nordic-highlight"
          >
            {t("admin.giftOrder.variantLabel")}
          </label>
          <select
            id="gift-variant"
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            required
            className="w-full rounded-lg border border-nordic-highlight/40 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="gift-quantity"
            className="mb-1 block text-xs text-nordic-highlight"
          >
            {t("admin.giftOrder.quantityLabel")}
          </label>
          <input
            id="gift-quantity"
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            className="w-full rounded-lg border border-nordic-highlight/40 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="gift-email"
            className="mb-1 block text-xs text-nordic-highlight"
          >
            {t("admin.giftOrder.emailLabel")}
          </label>
          <input
            id="gift-email"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            required
            placeholder={t("admin.giftOrder.emailPlaceholder")}
            className="w-full rounded-lg border border-nordic-highlight/40 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder:text-nordic-highlight focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="gift-username"
            className="mb-1 block text-xs text-nordic-highlight"
          >
            {t("admin.giftOrder.usernameLabel")}
          </label>
          <input
            id="gift-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t("admin.giftOrder.usernamePlaceholder")}
            className="w-full rounded-lg border border-nordic-highlight/40 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 placeholder:text-nordic-highlight focus:border-purple-500 focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-nordic-highlight">
            {t("admin.giftOrder.usernameHint")}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-nordic-secondary transition hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
        {t("admin.giftOrder.submit")}
      </button>
    </form>
  );
}
