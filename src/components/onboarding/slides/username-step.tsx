"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useT } from "@/i18n/client";

// Samma regler som slugifyUsername i src/lib/apple-user.ts och
// registrerings-/kontoflödena: gemener, siffror, understreck, 3-20 tecken.
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

interface UsernameStepContentProps {
  initialUsername: string;
  onSaved: (username: string) => void;
  onSkip: () => void;
}

type CheckState = "idle" | "checking" | "available" | "taken" | "invalid";

export function UsernameStepContent({
  initialUsername,
  onSaved,
  onSkip,
}: UsernameStepContentProps) {
  const t = useT();
  const [username, setUsername] = useState(normalize(initialUsername));
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!USERNAME_PATTERN.test(username)) {
      setCheckState(username.length > 0 ? "invalid" : "idle");
      return;
    }

    setCheckState("checking");
    const requestId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/account/username-available?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();

        if (requestId !== requestIdRef.current) return; // svar från äldre keystroke

        if (!res.ok) {
          setCheckState("idle");
          return;
        }

        setCheckState(data.available ? "available" : "taken");
      } catch {
        if (requestId === requestIdRef.current) setCheckState("idle");
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const handleContinue = async () => {
    setSubmitError("");

    if (!USERNAME_PATTERN.test(username)) {
      setCheckState("invalid");
      return;
    }

    // Oförändrat (behöll det auto-genererade) — inget att spara, gå vidare.
    if (username === initialUsername.toLowerCase()) {
      onSaved(username);
      return;
    }

    if (checkState === "taken") return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? t("onboarding.username.saveFailed"));
        setSubmitting(false);
        return;
      }

      onSaved(username);
    } catch {
      setSubmitError(t("onboarding.username.saveFailed"));
      setSubmitting(false);
    }
  };

  const canContinue =
    submitting === false &&
    USERNAME_PATTERN.test(username) &&
    checkState !== "checking" &&
    checkState !== "taken";

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
          {t("onboarding.username.title")}
        </h2>
        <p className="text-sm sm:text-lg text-slate-400 leading-relaxed mt-2">
          {t("onboarding.username.desc")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="onboarding-username" className="sr-only">
          {t("onboarding.username.label")}
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm sm:text-base font-mono pointer-events-none">
            avyracards.se/u/
          </span>
          <input
            id="onboarding-username"
            type="text"
            autoFocus
            value={username}
            onChange={(e) => setUsername(normalize(e.target.value))}
            className={`w-full pl-[7.7rem] sm:pl-[8.5rem] pr-10 py-3 sm:py-4 rounded-xl bg-slate-800 border text-white font-mono text-sm sm:text-base focus:outline-none focus:ring-2 transition-all ${
              checkState === "taken" || checkState === "invalid"
                ? "border-red-500/50 focus:ring-red-500/50"
                : checkState === "available"
                  ? "border-emerald-500/50 focus:ring-emerald-500/50"
                  : "border-slate-700 focus:ring-indigo-500/50"
            }`}
            placeholder={t("onboarding.username.placeholder")}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkState === "checking" && (
              <Loader2 className="animate-spin text-slate-500" size={18} />
            )}
            {checkState === "available" && (
              <CheckCircle2 className="text-emerald-500" size={18} />
            )}
            {(checkState === "taken" || checkState === "invalid") && (
              <XCircle className="text-red-500" size={18} />
            )}
          </span>
        </div>

        {checkState === "taken" && (
          <p className="text-xs text-red-400">{t("onboarding.username.taken")}</p>
        )}
        {checkState === "invalid" && (
          <p className="text-xs text-red-400">{t("onboarding.username.invalid")}</p>
        )}
        {submitError && <p className="text-xs text-red-400">{submitError}</p>}
      </div>

      <div className="pt-2 space-y-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base sm:text-lg rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : t("onboarding.username.continue")}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={submitting}
          className="w-full py-2 text-sm text-slate-500 hover:text-white font-medium transition-colors"
        >
          {t("onboarding.username.skip")}
        </button>
      </div>
    </div>
  );
}
