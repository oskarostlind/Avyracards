"use client";

import { requestPasswordReset } from "@/actions/reset-password";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await requestPasswordReset(formData);
    setLoading(false);
    if (res?.message) setMessage(res.message);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-nordic-primary px-4">
      <div className="w-full max-w-md space-y-8 bg-slate-900 p-8 rounded-2xl border border-nordic-highlight/40">
        <div>
          <h2 className="text-2xl font-bold text-nordic-secondary text-center">Glömt lösenord?</h2>
          <p className="mt-2 text-center text-sm text-nordic-highlight">
            Inga problem. Skriv in din mail så löser vi det.
          </p>
        </div>

        {message ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg text-emerald-400 text-center text-sm">
            {message}
          </div>
        ) : (
          <form action={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border border-nordic-highlight/40 bg-nordic-primary px-3 py-3 text-nordic-secondary placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="namn@exempel.se"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-nordic-secondary hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Skickar..." : "Skicka återställningslänk"}
            </button>
          </form>
        )}
        
        <div className="text-center">
            <Link href="/login" className="text-sm text-nordic-highlight hover:text-nordic-secondary">Tillbaka till inloggning</Link>
        </div>
      </div>
    </div>
  );
}