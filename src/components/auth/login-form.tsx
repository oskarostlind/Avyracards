"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get callbackUrl from URL, default to /dashboard
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Fyll i alla fält");
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.toLowerCase().includes("verifiera")) {
             setError("Du måste verifiera din e-postadress innan du kan logga in.");
        } else {
             setError("Felaktig e-post eller lösenord");
        }
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("Något gick fel. Försök igen.");
      setLoading(false);
    }
  };

  return (
    // CONTAINER: Använder nordic-primary för mörk bakgrund + en tunn border i highlight-färgen
    <div className="w-full max-w-md p-8 space-y-8 bg-nordic-primary border border-nordic-highlight/20 rounded-2xl shadow-2xl">
      
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h3 className="text-xs font-bold tracking-widest text-nordic-highlight uppercase">
          AvyraCards
        </h3>
        <h1 className="text-3xl font-bold text-nordic-secondary tracking-tight">
          Logga in
        </h1>
        <p className="text-nordic-highlight text-sm">
          Logga in för att hantera din profil
        </p>
      </div>

      {/* Feedback Messages */}
      {registered && (
        // Här använder vi fortfarande grön för success, det är standard UX.
        <div className="p-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
          Ditt konto har skapats! 
          <br/>Vi har skickat ett verifieringsmail till dig.
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center flex flex-col gap-2">
          <span>{error}</span>
          <Link href="/verify-resend" className="text-xs underline hover:text-red-300">
            Fick du inget mail? Skicka igen
          </Link>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          
          {/* Email Field */}
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="text-sm font-medium text-nordic-secondary block"
            >
              E-post
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
              placeholder="namn@exempel.se"
              // INPUT STYLING:
              // bg-nordic-primary (mörk botten)
              // border-nordic-highlight/30 (subtil ram)
              // text-nordic-secondary (vit text)
              // focus:ring-nordic-accent (turkos fokus-ring)
              className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary placeholder:text-nordic-highlight/50 focus:outline-none focus:ring-2 focus:ring-nordic-accent/50 focus:border-nordic-accent transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="password" 
                className="text-sm font-medium text-nordic-secondary block"
              >
                Lösenord
              </label>
              {/* ACCENT LÄNK: Använder nordic-accent (turkos) istället för emerald */}
              <Link 
                href="/forgot-password"
                className="text-xs font-medium text-nordic-accent hover:text-nordic-accent/80 transition-colors"
              >
                Glömt lösenord?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={loading}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary placeholder:text-nordic-highlight/50 focus:outline-none focus:ring-2 focus:ring-nordic-accent/50 focus:border-nordic-accent transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          // BUTTON: Använder nordic-secondary (Vit) som bakgrund för hög kontrast,
          // och nordic-primary (Mörk) för texten inuti knappen.
          className="w-full py-3.5 px-4 bg-nordic-secondary hover:bg-nordic-support text-nordic-primary font-bold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
        >
          {loading ? "Loggar in..." : "Logga in"}
        </button>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-2">
          <Link
            href="/get-started"
            className="block text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
          >
            Har du inget konto? <span className="font-semibold text-nordic-secondary">Skapa konto</span>
          </Link>

          <Link
            href="/verify-resend"
            className="block text-xs text-nordic-highlight hover:text-nordic-secondary transition-colors"
          >
            Har du inte fått verifieringsmailet? <span className="underline">Skicka igen</span>
          </Link>
        </div>
      </form>
    </div>
  );
}