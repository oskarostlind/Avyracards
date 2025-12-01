"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { z } from "zod";

const formSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(6).max(128),
});

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setError("Kontrollera användarnamn och lösenord.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      username: parsed.data.username,
      password: parsed.data.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Felaktiga inloggningsuppgifter.");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-8 shadow-xl shadow-black/40 backdrop-blur"
      >
        {/* Header */}
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-slate-400">
            SOCIALCARD
          </p>
          <h1 className="text-2xl font-semibold text-slate-50">Logga in</h1>
          <p className="text-sm text-slate-400">
            Fyll i dina uppgifter för att komma åt din dashboard.
          </p>
        </div>

        <div className="space-y-4">
          {/* Användarnamn */}
          <div className="space-y-2">
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
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="Ditt användarnamn"
            />
          </div>

          {/* Lösenord */}
          <div className="space-y-2">
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
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-50 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40"
              placeholder="••••••••"
            />
          </div>

          {/* Error-meddelande */}
          {error && (
            <p className="text-sm text-rose-400">
              {error}
            </p>
          )}

          {/* CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-purple-500/30 transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loggar in..." : "Logga in"}
            </button>
          </div>

          {/* Liten hjälptext */}
          <p className="pt-1 text-center text-xs text-slate-500">
            Har du inget konto ännu? Skapa ett via
            {" "}
            <span className="font-medium text-slate-200">Bli medlem</span>-knappen i menyn.
          </p>
        </div>
      </form>
    </div>
  );
}
