"use client";

import { resetPassword } from "@/actions/reset-password";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return <div className="min-h-screen flex items-center justify-center text-white">Ogiltig länk.</div>;
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    // Lägg till token i formData manuellt eftersom den inte är en input
    formData.append("token", token!);
    
    const res = await resetPassword(formData);
    // Om vi är här har redirect inte skett (dvs fel)
    setLoading(false);
    if (res?.error) setError(res.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white text-center">Nytt lösenord</h2>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">Nytt lösenord</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Sparar..." : "Spara nytt lösenord"}
          </button>
        </form>
      </div>
    </div>
  );
}