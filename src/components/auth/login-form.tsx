"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppleSignInButton } from "@/components/auth/apple-sign-in-button";
import { useIsApp } from "@/hooks/useIsApp";
import { isIosNativePaymentsEnabled } from "@/lib/ios-native";
import { useT } from "@/i18n/client";

export default function LoginForm() {
  const t = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isApp = useIsApp();
  // Guideline 4.8 kräver att Sign in with Apple ERBJUDS när tredjepartsinloggning
  // finns — inte att den egna inloggningen göms. Tidigare dolde appen
  // e-post/lösenord helt, vilket gjorde det omöjligt för App Review att logga in
  // med demokontot i review notes: de hade bara kunnat skapa ett nytt tomt konto
  // via sitt eget Apple-ID. Apple-knappen ligger kvar överst, men formuläret
  // finns alltid kvar under den.
  const showAppleButton = isApp && isIosNativePaymentsEnabled();
  
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const registered = searchParams.get("registered");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // State för att spåra vad användaren skriver i e-postfältet
  const [emailInput, setEmailInput] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError(t("common.required"));
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
             setError(t("auth.login.errorUnverified"));
        } else {
             setError(t("auth.login.errorInvalid"));
        }
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError(t("common.somethingWentWrong"));
      setLoading(false);
    }
  };

  return (
    // ÄNDRING HÄR: Bytte från bg-nordic-primary till bg-slate-900 för att matcha forgot-password
    <div className="w-full max-w-md p-8 space-y-8 bg-slate-900 border border-nordic-highlight/20 rounded-2xl shadow-2xl">
      
      <div className="text-center space-y-2">
        <h3 className="text-xs font-bold tracking-widest text-nordic-highlight uppercase">
          {t("auth.login.eyebrow")}
        </h3>
        <h1 className="text-3xl font-bold text-nordic-secondary tracking-tight">
          {t("auth.login.title")}
        </h1>
        <p className="text-nordic-highlight text-sm">
          {t("auth.login.subtitle")}
        </p>
      </div>

      {registered && (
        <div className="p-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
          {t("auth.login.registeredTitle")}
          <br />
          {t("auth.login.registeredBody")}
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center flex flex-col gap-2">
          <span>{error}</span>
          <Link href={`/verify-resend?email=${encodeURIComponent(emailInput)}`} className="text-xs underline hover:text-red-300">
            {t("auth.login.resendVerification")}
          </Link>
        </div>
      )}

      {showAppleButton && (
        <div className="space-y-4">
          <AppleSignInButton callbackUrl={callbackUrl} />
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-nordic-highlight/20" />
            <span className="text-[11px] uppercase tracking-wider text-nordic-highlight">
              {t("auth.login.or")}
            </span>
            <div className="h-px flex-1 bg-nordic-highlight/20" />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="text-sm font-medium text-nordic-secondary block"
            >
              {t("common.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={loading}
              placeholder={t("auth.login.emailPlaceholder")}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full px-4 py-3 bg-nordic-primary border border-nordic-highlight/30 rounded-xl text-nordic-secondary placeholder:text-nordic-highlight/50 focus:outline-none focus:ring-2 focus:ring-nordic-accent/50 focus:border-nordic-accent transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="password" 
                className="text-sm font-medium text-nordic-secondary block"
              >
                {t("common.password")}
              </label>
              
              <Link 
                href={emailInput ? `/forgot-password?email=${encodeURIComponent(emailInput)}` : "/forgot-password"}
                className="text-xs font-medium text-nordic-accent hover:text-nordic-accent/80 transition-colors"
              >
                {t("auth.login.forgotPassword")}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-nordic-secondary hover:bg-nordic-support text-nordic-primary font-bold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-white/5"
        >
          {loading ? t("auth.login.submitting") : t("auth.login.title")}
        </button>

        <div className="text-center space-y-4 pt-2">
          <Link
            href="/get-started"
            className="block text-sm text-nordic-highlight hover:text-nordic-secondary transition-colors"
          >
            {t("auth.login.noAccount")}{" "}
            <span className="font-semibold text-nordic-secondary">{t("auth.login.createAccount")}</span>
          </Link>
        </div>
      </form>
    </div>
  );
}