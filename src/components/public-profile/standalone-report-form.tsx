"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { REPORT_REASON_KEYS, REPORT_REASON_LABELS } from "@/lib/moderation-shared";

export function StandaloneReportForm({
  defaultUsername = "",
}: {
  defaultUsername?: string;
}) {
  const [username, setUsername] = useState(defaultUsername);
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
        body: JSON.stringify({
          username: username.replace(/^@/, "").trim(),
          reason,
          details,
          email,
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <Check size={22} />
        </div>
        <h2 className="text-lg font-semibold">Rapporten är mottagen</h2>
        <p className="mt-1 text-sm text-slate-300">
          Vi granskar den inom 24 timmar.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-400">
          Användarnamn på profilen
        </span>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="@anvandarnamn"
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-400">Anledning</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
        >
          {REPORT_REASON_KEYS.map((key) => (
            <option key={key} value={key}>
              {REPORT_REASON_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-400">
          Beskrivning (valfritt)
        </span>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          maxLength={2000}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-slate-400">
          Din e-post (valfritt)
        </span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm"
        />
      </label>

      {state === "error" && (
        <p className="text-xs text-red-400">
          Kunde inte skicka rapporten. Mejla kontakt@avyracards.se i stället.
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {state === "sending" && <Loader2 size={16} className="animate-spin" />}
        Skicka rapport
      </button>
    </form>
  );
}
