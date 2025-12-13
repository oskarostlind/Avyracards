import { CreditCard, Plus } from "lucide-react";
import Link from "next/link";

interface Card {
  id: string;
  cardCode: string;
  status: string;
  createdAt: Date;
}

export function CardsView({ cards }: { cards: Card[] }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-100">Mina NFC Kort</h3>
        <Link
          href="/activate"
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          <Plus size={14} /> Aktivera nytt kort
        </Link>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/20">
          <CreditCard className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">Inga kort kopplade ännu.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-14 rounded bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center">
                  <span className="text-[10px] text-slate-400">NFC</span>
                </div>
                <div>
                  <div className="font-mono text-sm text-slate-200">
                    {card.cardCode}
                  </div>
                  <div className="text-xs text-slate-500">
                    Tillagd {new Date(card.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                  {card.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}