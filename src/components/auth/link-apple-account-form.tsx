"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { isIosDebugEnabled } from "@/lib/ios-native";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";

interface LinkAppleAccountFormProps {
  identityToken: string;
  suggestedEmail?: string;
  message?: string;
  onSuccess: (loginToken: string) => Promise<void>;
  onCancel: () => void;
}

interface LinkResponse {
  loginToken?: string;
  error?: string;
}

export function LinkAppleAccountForm({
  identityToken,
  suggestedEmail,
  message,
  onSuccess,
  onCancel,
}: LinkAppleAccountFormProps) {
  const [email, setEmail] = useState(suggestedEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      logIosNativeRuntime({
        scope: "APPLE_LINK",
        location: "link-apple-account-form.tsx:submit",
        message: "Linking Apple account",
        data: { hasEmail: Boolean(email) },
      });

      const response = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityToken,
          linkEmail: email,
          linkPassword: password,
        }),
      });

      const data = (await response.json()) as LinkResponse;

      logIosNativeRuntime({
        scope: "APPLE_LINK",
        location: "link-apple-account-form.tsx:response",
        message: "Link API response",
        data: { status: response.status, ok: response.ok, hasLoginToken: Boolean(data.loginToken) },
        level: response.ok ? "info" : "error",
      });

      if (!response.ok || !data.loginToken) {
        throw new Error(data.error ?? "Kunde inte koppla kontot");
      }

      await onSuccess(data.loginToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logIosNativeRuntime({
        scope: "APPLE_LINK",
        location: "link-apple-account-form.tsx:catch",
        message: "Link failed",
        data: { error: message },
        level: "error",
      });
      console.error(err);
      setError(
        isIosDebugEnabled()
          ? `Koppling misslyckades: ${message}`
          : "Kunde inte koppla Apple-ID till kontot. Kontrollera uppgifterna."
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-bold text-nordic-secondary">Koppla Apple-ID</h2>
        <p className="text-xs text-nordic-highlight">
          {message ??
            "Det finns redan ett konto med denna e-post. Bekräfta med ditt lösenord för att koppla Apple-ID."}
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-post"
          className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Lösenord"
          className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-nordic-secondary text-nordic-primary font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : "Koppla konto"}
        </button>
      </form>

      <button
        type="button"
        onClick={onCancel}
        className="w-full text-sm text-nordic-highlight hover:text-nordic-secondary"
      >
        Avbryt
      </button>
    </div>
  );
}
