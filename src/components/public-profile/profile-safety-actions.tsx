"use client";

import { useState } from "react";
import { Flag, Ban, X, Loader2, Check } from "lucide-react";
import { REPORT_REASON_KEYS, reportReasonKey } from "@/lib/moderation-shared";
import { useT } from "@/i18n/client";

interface Props {
  username: string;
  isLoggedIn: boolean;
  initiallyBlocked?: boolean;
  /** Textfärg ärvs från temat så att kontrollerna syns på alla bakgrunder. */
  color?: string;
}

/**
 * Guideline 1.2: varje yta med användarskapat innehåll måste ha en synlig
 * väg att rapportera innehållet och blockera användaren. Granskaren letar
 * efter dem på själva profilen — att bara ha dem i en inställningsmeny räcker
 * inte. Kontrollerna ligger därför i foten av varje publik profil.
 */
export function ProfileSafetyActions({
  username,
  isLoggedIn,
  initiallyBlocked = false,
  color,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked);
  const [blocking, setBlocking] = useState(false);

  const handleBlockToggle = async () => {
    if (!isLoggedIn) {
      window.location.href = `/login?callbackUrl=/u/${encodeURIComponent(username)}`;
      return;
    }

    setBlocking(true);
    try {
      const res = await fetch("/api/block", {
        method: blocked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlocked(Boolean(data.blocked));
        if (data.blocked) window.location.reload();
      }
    } finally {
      setBlocking(false);
    }
  };

  return (
    <>
      <div
        className="mt-6 flex items-center justify-center gap-4 text-[11px] opacity-60 hover:opacity-100 transition-opacity"
        style={{ color }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 underline-offset-2 hover:underline"
        >
          <Flag size={12} />
          {t("moderation.reportProfile")}
        </button>
        <span aria-hidden>·</span>
        <button
          type="button"
          onClick={handleBlockToggle}
          disabled={blocking}
          className="flex items-center gap-1.5 underline-offset-2 hover:underline disabled:opacity-50"
        >
          {blocking ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
          {blocked ? t("moderation.unblock") : t("moderation.block")}
        </button>
      </div>

      {open && (
        <ReportDialog username={username} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function ReportDialog({
  username,
  onClose,
}: {
  username: string;
  onClose: () => void;
}) {
  const t = useT();
  const [reason, setReason] = useState<string>(REPORT_REASON_KEYS[0]);
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, reason, details, email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 text-left text-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label={t("moderation.close")}
        >
          <X size={18} />
        </button>

        {state === "done" ? (
          <div className="space-y-3 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check size={22} />
            </div>
            <h2 className="text-lg font-semibold">{t("moderation.receivedTitle")}</h2>
            <p className="text-sm text-slate-400">
              {t("moderation.receivedBodyBefore")}{" "}
              <a href="mailto:kontakt@avyracards.se" className="underline">
                kontakt@avyracards.se
              </a>
              .
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium hover:bg-white/15"
            >
              {t("moderation.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t("moderation.dialogTitle", { username })}</h2>
              <p className="mt-1 text-sm text-slate-400">
                {t("moderation.dialogIntro")}
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-400">{t("moderation.reason")}</span>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
              >
                {REPORT_REASON_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t(reportReasonKey(key))}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-400">
                {t("moderation.detailsLabel")}
              </span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
                placeholder={t("moderation.detailsPlaceholder")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-slate-400">
                {t("moderation.emailLabel")}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
                placeholder={t("moderation.emailPlaceholder")}
              />
            </label>

            {state === "error" && (
              <p className="text-xs text-red-400">
                {t("moderation.sendFailedBefore")}{" "}
                <a href="mailto:kontakt@avyracards.se" className="underline">
                  kontakt@avyracards.se
                </a>{" "}
                {t("moderation.sendFailedAfter")}
              </p>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {state === "sending" && <Loader2 size={16} className="animate-spin" />}
              {t("moderation.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
