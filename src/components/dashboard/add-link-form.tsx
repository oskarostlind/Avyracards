"use client";

import { useState } from "react";

import { z } from "zod";

const schema = z.object({
  label: z.string().min(1).max(60),
  url: z.string().url(),
});

interface AddLinkFormProps {
  onCreated: () => Promise<void> | void;
}

export function AddLinkForm({ onCreated }: AddLinkFormProps) {
  const [form, setForm] = useState({ label: "", url: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError("Kontrollera fälten");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Kunde inte spara länk");
        return;
      }

      setForm({ label: "", url: "" });
      await onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Lägg till ny länk</h2>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="label">
          Titel
        </label>
        <input
          id="label"
          name="label"
          required
          value={form.label}
          onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="url">
          URL
        </label>
        <input
          id="url"
          name="url"
          required
          value={form.url}
          onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {loading ? "Sparar..." : "Spara länk"}
      </button>
    </form>
  );
}
