"use client";

import { QRCodeSVG } from "qrcode.react"; // <-- Ändrad import
import { type Card } from "@prisma/client";
import { useT } from "@/i18n/client";

interface PackingSlipProps {
  orderId: string;
  customerName: string;
  cards: Card[];
}

/**
 * Skrivs ut med Ctrl+P från orderdetaljsidan. Allt annat på sidan är
 * print:hidden, så följesedeln ligger i normalt flöde — INTE absolut
 * positionerad. Tidigare låg den print:absolute ovanpå en wrapper som behöll
 * min-h-screen vid utskrift, vilket gav en tom andra sida; footern var
 * dessutom position:fixed och repeterades på varje sida.
 */
export function PackingSlip({ orderId, customerName, cards }: PackingSlipProps) {
  const t = useT();
  return (
    <div className="hidden print:block print:w-full print:bg-white print:p-8">
      {/* Huvud/Logga */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-nordic-secondary">AvyraCards</h1>
          <p className="text-sm text-nordic-highlight mt-2">{t("packingSlip.tagline")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-nordic-highlight">Order #{orderId.slice(-6).toUpperCase()}</p>
          <p className="text-sm text-nordic-highlight">{new Date().toLocaleDateString("sv-SE")}</p>
        </div>
      </div>

      {/* Välkomsttext */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-nordic-secondary mb-3">{t("packingSlip.greeting", { name: customerName || t("packingSlip.greetingFallback") })}</h2>
        <p className="text-base text-gray-700 max-w-xl leading-relaxed">
          {t("packingSlip.thanks")}
        </p>
      </div>

      {/* Instruktioner */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-base font-bold text-nordic-secondary uppercase tracking-wider mb-3 border-b border-black/10 pb-2">
            {t("packingSlip.getStartedTitle")}
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>{t("packingSlip.step1")}</li>
            <li>{t("packingSlip.step2")}</li>
            <li>{t("packingSlip.step3")}</li>
            <li>{t("packingSlip.createAccount")}</li>
          </ol>
        </div>

        <div className="bg-transparent p-4 rounded-xl border border-nordic-support">
          <h3 className="text-sm font-bold text-nordic-highlight uppercase tracking-wider mb-2">
            {t("packingSlip.helpTitle")}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {t("packingSlip.helpBody")}
          </p>
          <p className="text-sm font-medium text-nordic-secondary">support@avyracards.se</p>
        </div>
      </div>

      {/* Kort & QR Koder */}
      <div>
        <h3 className="text-base font-bold text-nordic-secondary uppercase tracking-wider mb-4">
          Dina kort ({cards.length} st)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => {
            const url = `https://avyracards.se/c/${card.cardCode}`;
            return (
              <div key={card.id} className="flex items-start gap-4 p-4 border-2 border-dashed border-gray-300 rounded-2xl break-inside-avoid">
                <div className="bg-white p-2 rounded-lg shadow-sm border border-nordic-support">
                  {/* Använd QRCodeSVG här istället */}
                  <QRCodeSVG value={url} size={88} level="H" />
                </div>
                <div>
                  <p className="text-xs text-nordic-highlight uppercase font-bold mb-1">{t("packingSlip.cardId")}</p>
                  <p className="text-lg font-mono font-bold text-nordic-secondary mb-2">{card.cardCode}</p>
                  <p className="text-xs text-nordic-highlight mb-1">{t("packingSlip.activationLink")}</p>
                  <p className="text-xs text-gray-800 break-all font-mono">{url}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer — normalt flöde, inte fixed (fixed repeteras på varje
          utskriven sida och kunde ensam tvinga fram en extra sida). */}
      <div className="mt-10 text-center text-xs text-nordic-highlight">
        <p>AvyraCards Sweden AB &bull; www.avyracards.se</p>
      </div>
    </div>
  );
}
