"use client";

import { requestPasswordReset } from "@/actions/reset-password";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  // Hämta mail från URL om den finns
  const emailFromUrl = searchParams.get("email") || "";

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await requestPasswordReset(formData);
    setLoading(false);
    if (res?.message) setMessage(res.message);
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-nordic-primary border border-nordic-highlight/20 rounded-2xl shadow-2xl">
      
      {/* Header med ikon */}
      <div className="text-center space-y-2">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-nordic-primary border border-nordic-highlight/30">
             <Mail className="h-6 w-6 text-nordic-accent" />
        </div>
        <h2 className="text-2xl font-bold text-nordic-secondary tracking-tight">
          Glömt lösenord?
        </h2>
        <p className="text-nordic-highlight text-sm">
          Inga problem. Skriv in din e-post så skickar vi en länk för att återställa det.
        </p>
      </div>

      {message ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in fade-in zoom-in-95">
            <div className="mb-3 flex justify-center text-emerald-400">
                <CheckCircle2 size={32} />
            </div>
            <p className="text-sm font-medium text-emerald-200">
                {message}
            </p>
            <div className="mt-6">
                <Link href="/login" className="text-sm text-emerald-400 hover:text-emerald-300 font-bold">
                    Tillbaka till inloggning
                </Link>
            </div>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-nordic-secondary block">
                E-post
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={emailFromUrl} // Här förifyller vi!
              placeholder="namn@exempel.se"
              className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary placeholder:text-nordic-highlight/50 focus:outline-none focus:ring-2 focus:ring-nordic-accent/50 focus:border-nordic-accent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-nordic-secondary hover:bg-nordic-support text-nordic-primary font-bold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
          >
            {loading ? (
                <>
                    <Loader2 size={18} className="animate-spin" /> Skickar...
                </>
            ) : (
                "Skicka återställningslänk"
            )}
          </button>
        </form>
      )}

      {/* Footer Link */}
      {!message && (
          <div className="text-center pt-2">
            <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
            >
                <ArrowLeft size={16} className="mr-2" />
                Tillbaka till inloggning
            </Link>
          </div>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nordic-primary px-4">
      {/* Suspense behövs för useSearchParams i client components */}
      <Suspense fallback={<div className="text-nordic-highlight">Laddar...</div>}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}