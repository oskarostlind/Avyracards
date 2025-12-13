import { Star } from "lucide-react";
import Link from "next/link";

export function BillingView({ isPremium }: { isPremium: boolean }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-medium text-slate-100">Din Plan</h3>
            {isPremium ? (
              <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star size={10} fill="currentColor" /> PREMIUM
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-400 text-xs font-bold px-2 py-0.5 rounded-full">
                GRATIS
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            {isPremium
              ? "Du har tillgång till alla premiumfunktioner."
              : "Uppgradera för att låsa upp statistik och teman."}
          </p>
        </div>

        {isPremium ? (
          <button className="whitespace-nowrap rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700">
            Hantera via Stripe
          </button>
        ) : (
          <Link
            href="/checkout/premium"
            className="whitespace-nowrap rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20"
          >
            Uppgradera Nu
          </Link>
        )}
      </div>
    </div>
  );
}