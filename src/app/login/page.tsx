"use client";

import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Fel e-post eller lösenord.");
      return;
    }

    router.push(res.url ?? "/dashboard");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Logga in</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">E-post</label>
          <input
            type="email"
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Lösenord</label>
          <input
            type="password"
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 px-4 py-2 rounded-md bg-slate-50 text-slate-900 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Loggar in..." : "Logga in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-400">
        Har du inget konto?{" "}
        <a href="/register" className="underline">
          Skapa konto
        </a>
      </p>
    </div>
  );
}
