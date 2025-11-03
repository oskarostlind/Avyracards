"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6).max(128),
});

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setError("Kontrollera användarnamn och lösenord");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Kunde inte skapa konto");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        username: parsed.data.username,
        password: parsed.data.password,
      });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Skapa konto</h1>
        <p className="text-sm text-slate-500">Registrera dig för att skapa din sociala kortprofil.</p>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="username">
          Användarnamn
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
          Lösenord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        />
      </div>
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {loading ? "Skapar konto..." : "Skapa konto"}
      </button>
    </form>
  );
}
