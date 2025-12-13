"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

interface AccountFormProps {
  email: string;
  marketingConsent: boolean;
  productUpdates: boolean;
  hideFromSearch: boolean;
}

export function AccountForm({
  email,
  marketingConsent: initialMarketing,
  productUpdates: initialUpdates,
  hideFromSearch: initialSearch,
}: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [marketing, setMarketing] = useState(initialMarketing);
  const [updates, setUpdates] = useState(initialUpdates);
  const [hideSearch, setHideSearch] = useState(initialSearch);
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketingConsent: marketing,
          productUpdates: updates,
          hideFromSearch: hideSearch,
        }),
      });

      if (!res.ok) throw new Error("Kunde inte spara");
      setStatus("✅ Inställningar sparade");
      
      // Rensa statusmeddelande efter 3 sekunder
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus("❌ Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Sektion: Inloggning */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-medium text-slate-100 mb-4">Inloggningsuppgifter</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-400 block mb-1.5">E-postadress</label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                disabled
                value={email}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-slate-400 opacity-75 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Din e-postadress används för inloggning och kvitton.
            </p>
          </div>
        </div>
      </section>

      {/* Sektion: Integritet & Kommunikation */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-slate-100">Inställningar & Integritet</h3>
            <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-white text-slate-900 px-4 py-2 text-sm font-bold hover:bg-slate-200 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Spara"}
            </button>
        </div>
        
        {status && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                {status}
            </div>
        )}

        <div className="space-y-6">
          <ToggleItem
            label="Marknadsföring"
            description="Jag vill ta emot erbjudanden och tips om hur jag växer mitt nätverk."
            checked={marketing}
            onChange={setMarketing}
          />
          <ToggleItem
            label="Produktnyheter"
            description="Meddela mig när nya funktioner (som statistik eller teman) släpps."
            checked={updates}
            onChange={setUpdates}
          />
          <div className="h-px bg-slate-800 my-4" />
          <ToggleItem
            label="Dölj från Google"
            description="Neka sökmotorer från att indexera din SocialCard-profil."
            checked={hideSearch}
            onChange={setHideSearch}
          />
        </div>
      </section>

      {/* Sektion: Danger Zone */}
      <section className="rounded-2xl border border-red-900/30 bg-red-950/5 p-6">
        <h3 className="text-lg font-medium text-red-400 mb-2">Radera konto</h3>
        <p className="text-sm text-slate-400 mb-4">
            När du raderar ditt konto försvinner all din data, inklusive länkar och statistik. Detta går inte att ångra.
        </p>
        <button 
            onClick={() => alert("Funktion kommer snart via support-kontakt.")}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium border border-red-900/50 hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
        >
            <Trash2 size={16} />
            Radera mitt konto
        </button>
      </section>
    </div>
  );
}

function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="font-medium text-slate-200 text-sm">{label}</div>
        <div className="text-xs text-slate-500 mt-1 leading-relaxed max-w-sm">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          checked ? "bg-purple-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}