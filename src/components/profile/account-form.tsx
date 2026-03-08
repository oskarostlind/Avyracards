"use client";

import { useState } from "react";
import { Loader2, Trash2, AlertTriangle, KeyRound, User, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface AccountFormProps {
  email: string;
  username: string;
  hasPassword: boolean;
  marketingConsent: boolean;
  productUpdates: boolean;
  hideFromSearch: boolean;
}

export function AccountForm({
  email,
  username: initialUsername,
  hasPassword,
  marketingConsent: initialMarketing,
  productUpdates: initialUpdates,
  hideFromSearch: initialSearch,
}: AccountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Form State
  const [marketing, setMarketing] = useState(initialMarketing);
  const [updates, setUpdates] = useState(initialUpdates);
  const [hideSearch, setHideSearch] = useState(initialSearch);
  
  // Security State
  const [username, setUsername] = useState(initialUsername);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setStatus(null);

    // Enkel validering på klientsidan
    if (newPassword && newPassword !== confirmPassword) {
      setStatus({ type: "error", msg: "De nya lösenorden matchar inte." });
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        marketingConsent: marketing,
        productUpdates: updates,
        hideFromSearch: hideSearch,
      };

      // Skicka bara med om det ändrats
      if (username !== initialUsername) {
        payload.username = username;
      }

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kunde inte spara inställningar.");
      }

      setStatus({ type: "success", msg: "Inställningar sparade!" });
      
      // Rensa lösenordsfälten
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      router.refresh(); // Uppdatera sidans data
      
      setTimeout(() => setStatus(null), 3000);
    } catch (error: any) {
      setStatus({ type: "error", msg: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Är du helt säker på att du vill radera ditt konto? Detta går inte att ångra.")) {
        return;
    }

    // Dubbelkoll
    const userInput = prompt("Skriv 'radera' för att bekräfta:");
    if (userInput?.toLowerCase() !== "radera") return;

    setLoading(true);
    try {
        const res = await fetch("/api/account", { method: "DELETE" });
        if (!res.ok) throw new Error("Kunde inte radera kontot.");
        
        // Logga ut och skicka till startsidan
        await signOut({ callbackUrl: "/" });
    } catch (error) {
        alert("Något gick fel vid radering.");
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      
      {/* --- STATUS MESSAGE --- */}
      {status && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${
            status.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
            {status.type === "success" ? "✅" : "⚠️"} {status.msg}
        </div>
      )}

      {/* --- 1. PROFIL & SYNLIGHET --- */}
      <section className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6 space-y-6">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <User size={18} className="text-nordic-highlight"/> Profilinställningar
        </h3>
        
        {/* Email (Låst) */}
        <div>
           <label className="text-sm font-medium text-nordic-highlight block mb-1.5">E-postadress</label>
           <input
             type="text"
             disabled
             value={email}
             className="w-full rounded-xl border border-nordic-highlight/40 bg-nordic-primary/50 px-4 py-2.5 text-nordic-highlight opacity-75 cursor-not-allowed"
           />
        </div>

        {/* Toggles */}
        <div className="space-y-4 pt-2">
            <ToggleItem
              label="Marknadsföring"
              description="Jag vill ta emot erbjudanden och tips."
              checked={marketing}
              onChange={setMarketing}
            />
            <ToggleItem
              label="Produktnyheter"
              description="Meddela mig när nya funktioner släpps."
              checked={updates}
              onChange={setUpdates}
            />
            <div className="h-px bg-slate-800 my-4" />
            <ToggleItem
              label="Dölj från Google"
              description="Neka sökmotorer från att indexera din profil."
              checked={hideSearch}
              onChange={setHideSearch}
            />
        </div>
      </section>

      {/* --- 2. SÄKERHET --- */}
      <section className="rounded-2xl border border-nordic-highlight/40 bg-slate-900/50 p-6 space-y-6">
        <h3 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            <KeyRound size={18} className="text-nordic-highlight"/> Säkerhet
        </h3>

        {/* Byt Användarnamn */}
        <div>
           <label className="text-sm font-medium text-nordic-highlight block mb-1.5">Användarnamn</label>
           <input
             type="text"
             value={username}
             onChange={(e) => setUsername(e.target.value)}
             className="w-full rounded-xl border border-nordic-highlight/40 bg-nordic-primary px-4 py-2.5 text-nordic-secondary focus:ring-2 focus:ring-blue-500 focus:outline-none"
           />
           {username !== initialUsername && (
               <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                   <AlertTriangle className="text-yellow-500 shrink-0" size={18} />
                   <div className="text-xs text-yellow-200/80">
                       <strong className="text-yellow-500 block mb-1">Varning!</strong>
                       Om du byter användarnamn kommer dina gamla QR-koder och länkar att sluta fungera omedelbart.
                   </div>
               </div>
           )}
        </div>

        {/* Byt Lösenord (Visas endast om användaren har lösenord) */}
        {hasPassword ? (
            <div className="space-y-4 pt-4 border-t border-nordic-highlight/40">
                <h4 className="text-sm font-medium text-slate-300">Byt lösenord</h4>
                <div className="grid gap-4">
                    <input
                        type="password"
                        placeholder="Nuvarande lösenord"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-nordic-highlight/40 bg-nordic-primary px-4 py-2.5 text-nordic-secondary placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="password"
                            placeholder="Nytt lösenord"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-xl border border-nordic-highlight/40 bg-nordic-primary px-4 py-2.5 text-nordic-secondary placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <input
                            type="password"
                            placeholder="Bekräfta nytt"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full rounded-xl border border-nordic-highlight/40 bg-nordic-primary px-4 py-2.5 text-nordic-secondary placeholder-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        ) : (
            <div className="p-4 rounded-xl bg-nordic-primary border border-nordic-highlight/40 text-sm text-nordic-highlight">
                Du loggar in med Google/Externt konto, så du behöver inte hantera lösenord här.
            </div>
        )}
      </section>

      {/* --- SAVE BUTTON --- */}
      <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-nordic-secondary text-nordic-primary px-6 py-3 font-bold hover:bg-nordic-support disabled:opacity-50 transition-all shadow-lg shadow-white/5"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Save size={18} />}
            Spara ändringar
          </button>
      </div>

      {/* --- 3. DANGER ZONE --- */}
      <section className="rounded-2xl border border-red-900/30 bg-red-950/5 p-6 mt-12">
        <h3 className="text-lg font-medium text-red-400 mb-2">Radera konto</h3>
        <p className="text-sm text-nordic-highlight mb-6 max-w-lg">
            När du raderar ditt konto försvinner all din data, inklusive länkar och statistik. Detta går inte att ångra.
        </p>
        <button 
          onClick={handleDeleteAccount}
          disabled={loading}
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
        <div className="text-xs text-nordic-highlight mt-1 leading-relaxed max-w-sm">{description}</div>
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