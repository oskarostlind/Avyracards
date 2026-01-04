"use client";

import { FormEvent, useState } from "react";
import { z } from "zod";

const schema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().url(),
});

interface AddLinkFormProps {
  onCreated: () => Promise<void> | void;
}

export function AddLinkForm({ onCreated }: AddLinkFormProps) {
  const [form, setForm] = useState<{ label: string; url: string }>({
    label: "",
    url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError("Kontrollera länkens titel och URL.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data), // { label, url }
      });

      if (!response.ok) {
        // Försök läsa fel från API:t
        try {
          const data = await response.json();
          setError(data.error ?? "Kunde inte spara länk");
        } catch {
          setError("Kunde inte spara länk");
        }
        return;
      }

      // Nollställ formuläret
      setForm({ label: "", url: "" });

      // Låt parent-komponent refetcha listan
      await onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
          Länktitel
        </label>
        <input
          type="text"
          value={form.label}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, label: e.target.value }))
          }
          placeholder="Ex. Instagram"
          className="w-full rounded-xl border border-nordic-highlight/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-200">
          URL
        </label>
        <input
          type="url"
          value={form.url}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, url: e.target.value }))
          }
          placeholder="https://..."
          className="w-full rounded-xl border border-nordic-highlight/40 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-nordic-secondary px-4 py-2 text-sm font-medium text-nordic-primary hover:bg-nordic-support disabled:opacity-60"
      >
        {loading ? "Sparar..." : "Lägg till länk"}
      </button>
    </form>
  );
}
