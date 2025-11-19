"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, username, name }),
      headers: { "Content-Type": "application/json" }
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Något gick fel.");
      return;
    }

    router.push("/login");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-6">Skapa konto</h1>
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
          <label className="block text-sm mb-1">Användarnamn (publik URL)</label>
          <input
            type="text"
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase())}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Namn (valfritt)</label>
          <input
            type="text"
            className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
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
          {loading ? "Skapar konto..." : "Skapa konto"}
        </button>
      </form>
    </div>
  );
}
