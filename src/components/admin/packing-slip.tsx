"use client";

import { QRCodeSVG } from "qrcode.react"; // <-- Ändrad import
import { type Card } from "@prisma/client";

interface PackingSlipProps {
  orderId: string;
  customerName: string;
  cards: Card[];
}

export function PackingSlip({ orderId, customerName, cards }: PackingSlipProps) {
  return (
    <div className="hidden print:block print:absolute print:top-0 print:left-0 print:w-full print:bg-white print:p-10 print:z-[10000]">
      {/* Huvud/Logga */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-black">AvyraCards</h1>
          <p className="text-sm text-gray-500 mt-2">Ditt digitala visitkort</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-gray-500">Order #{orderId.slice(-6).toUpperCase()}</p>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString("sv-SE")}</p>
        </div>
      </div>

      {/* Välkomsttext */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-black mb-4">Hej {customerName || "där"}! 👋</h2>
        <p className="text-lg text-gray-700 max-w-xl leading-relaxed">
          Tack för din beställning. Här kommer ditt nya AvyraCards! 
          Vi hoppas att det ska hjälpa dig att nätverka smartare och snyggare.
        </p>
      </div>

      {/* Instruktioner */}
      <div className="grid grid-cols-2 gap-12 mb-16">
        <div>
          <h3 className="text-lg font-bold text-black uppercase tracking-wider mb-4 border-b border-black/10 pb-2">
            Så här kommer du igång
          </h3>
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Slå på NFC på din telefon (ofta påslaget).</li>
            <li>Håll kortet mot toppen av din telefon.</li>
            <li>Klicka på notisen som dyker upp.</li>
            <li>Skapa ditt konto och bygg din profil!</li>
          </ol>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
            Behöver du hjälp?
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Om NFC inte fungerar direkt kan du alltid skanna QR-koden nedan eller besöka länken manuellt.
          </p>
          <p className="text-sm font-medium text-black">support@avyracards.se</p>
        </div>
      </div>

      {/* Kort & QR Koder */}
      <div>
        <h3 className="text-lg font-bold text-black uppercase tracking-wider mb-6">
          Dina kort ({cards.length} st)
        </h3>
        
        <div className="grid grid-cols-2 gap-8">
          {cards.map((card) => {
            const url = `https://avyracards.se/c/${card.cardCode}`;
            return (
              <div key={card.id} className="flex items-start gap-6 p-6 border-2 border-dashed border-gray-300 rounded-2xl break-inside-avoid">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                  {/* Använd QRCodeSVG här istället */}
                  <QRCodeSVG value={url} size={100} level="H" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Kort ID</p>
                  <p className="text-xl font-mono font-bold text-black mb-2">{card.cardCode}</p>
                  <p className="text-xs text-gray-500 mb-1">Aktiveringslänk:</p>
                  <p className="text-xs text-gray-800 break-all font-mono">{url}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-10 left-10 right-10 text-center text-xs text-gray-400">
        <p>AvyraCards Sweden AB &bull; www.avyracards.se</p>
      </div>
    </div>
  );
}