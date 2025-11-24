"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setError("Kontrollera användarnamn, e-post och lösenord.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Något gick fel vid skapande av konto.");
        return;
      }

      router.push("/verify-sent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 px-8 py-10 shadow-xl backdrop-blur"
    >
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          SocialCard
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-50">
          Skapa konto
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Registrera dig för att skapa din digitala kortprofil.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-slate-200"
            htmlFor="username"
          >
            Användarnamn
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={form.username}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, username: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
          />
        </div>

        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-slate-200"
            htmlFor="email"
          >
            E-post
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
          />
        </div>

        <div className="space-y-1">
          <label
            className="block text-sm font-medium text-slate-200"
            htmlFor="password"
          >
            Lösenord
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-50 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-rose-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
      >
        {loading ? "Skapar konto..." : "Skapa konto"}
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        Genom att skapa konto godkänner du våra användarvillkor.
      </p>
    </form>
  );
}
