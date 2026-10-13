"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { LinkAppleAccountForm } from "@/components/auth/link-apple-account-form";
import { useLocale, useT } from "@/i18n/client";
import {
  createAppleWebNonce,
  getAppleJsScriptUrl,
  getAppleWebRedirectUri,
  getPublicAppleServicesId,
  type AppleWebNonce,
} from "@/lib/apple-web-auth";

/**
 * Sign in with Apple på WEBBEN (Apple JS, popup-läge — samma lilla Apple ID-
 * fönster som t.ex. Zalando använder). I iOS-appen visas i stället den native
 * knappen (AppleSignInButton), så den här renderar ingenting där.
 *
 * Renderar heller ingenting förrän NEXT_PUBLIC_APPLE_SERVICES_ID är satt, så
 * att inget går sönder innan Services ID:t är skapat i Apple-portalen.
 */

// Minimal typning av Apple JS (window.AppleID) — bara det vi använder.
interface AppleSignInSuccess {
  authorization: { code?: string; id_token: string; state?: string };
  // Kommer BARA första gången användaren godkänner appen.
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
}

interface AppleIDAuth {
  init: (config: {
    clientId: string;
    scope: string;
    redirectURI: string;
    state?: string;
    nonce?: string;
    usePopup?: boolean;
  }) => void;
  signIn: () => Promise<AppleSignInSuccess>;
}

declare global {
  interface Window {
    AppleID?: { auth: AppleIDAuth };
  }
}

interface AppleAuthResponse {
  loginToken?: string;
  needsLink?: boolean;
  email?: string;
  message?: string;
  error?: string;
}

interface AppleWebSignInButtonProps {
  /** Vart användaren skickas efter lyckad inloggning. */
  callbackUrl?: string;
  /** "signIn" = "Logga in med Apple" (login), "continue" = "Fortsätt med Apple" (registrering). */
  variant?: "signIn" | "continue";
  /** Visa "eller"-avdelare under knappen (försvinner tillsammans med knappen). */
  withDivider?: boolean;
}

// Fel som betyder att användaren själv avbröt — ska hanteras tyst.
const SILENT_APPLE_ERRORS = new Set(["popup_closed_by_user", "user_cancelled_authorize"]);

let appleScriptPromise: Promise<void> | null = null;

function loadAppleScript(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.AppleID?.auth) return Promise.resolve();
  if (appleScriptPromise) return appleScriptPromise;

  appleScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Tillåt nytt försök vid nästa mount (t.ex. tillfälligt nätverksfel).
      appleScriptPromise = null;
      script.remove();
      reject(new Error("Kunde inte ladda Apple JS"));
    };
    document.head.appendChild(script);
  });

  return appleScriptPromise;
}

function isNativeApp(): boolean {
  const capacitor = (window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
  }).Capacitor;
  return capacitor?.isNativePlatform?.() === true;
}

export function AppleWebSignInButton({
  callbackUrl = "/dashboard",
  variant = "signIn",
  withDivider = false,
}: AppleWebSignInButtonProps) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const servicesId = getPublicAppleServicesId();

  // "unknown" tills vi vet om vi kör i webbläsare eller i iOS-appen — annars
  // blinkar webbknappen förbi i appen innan Capacitor hunnit identifieras.
  const [platform, setPlatform] = useState<"unknown" | "web" | "app">("unknown");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkState, setLinkState] = useState<{
    identityToken: string;
    rawNonce: string;
    email?: string;
    message?: string;
  } | null>(null);

  // Nonce/state förbereds INNAN klicket: AppleID.auth.signIn() öppnar ett
  // popup-fönster och måste anropas synkront i klickhändelsen, annars
  // blockerar Safari popupen (ingen await före signIn).
  const nonceRef = useRef<AppleWebNonce | null>(null);

  const prepare = useCallback(async () => {
    if (!servicesId || !window.AppleID?.auth) return;
    setReady(false);
    const nonce = await createAppleWebNonce();
    nonceRef.current = nonce;
    window.AppleID.auth.init({
      clientId: servicesId,
      scope: "name email",
      redirectURI: getAppleWebRedirectUri(window.location.origin),
      state: nonce.state,
      // Apple lägger in värdet oförändrat i token. Vi skickar hashen hit och
      // rånoncen till servern, som hashar och jämför.
      nonce: nonce.hashedNonce,
      usePopup: true,
    });
    setReady(true);
  }, [servicesId]);

  useEffect(() => {
    setPlatform(isNativeApp() ? "app" : "web");
  }, []);

  useEffect(() => {
    if (platform !== "web" || !servicesId) return;
    let cancelled = false;

    loadAppleScript(getAppleJsScriptUrl(locale))
      .then(() => {
        if (!cancelled) return prepare();
      })
      .catch((err) => {
        console.error("[apple-web]", err);
      });

    return () => {
      cancelled = true;
    };
  }, [platform, servicesId, locale, prepare]);

  if (!servicesId || platform !== "web") {
    return null;
  }

  const completeLogin = async (loginToken: string) => {
    const result = await signIn("credentials", {
      appleLoginToken: loginToken,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(t("auth.apple.sessionFailed"));
    }

    // Nya Apple-användare (utan lösenord) får onboarding-modalen på
    // dashboarden — samma beteende som i iOS-appen.
    router.push(callbackUrl);
    router.refresh();
  };

  const handleClick = () => {
    const appleAuth = window.AppleID?.auth;
    const nonce = nonceRef.current;
    if (!appleAuth || !nonce) return;

    setLoading(true);
    setError("");

    // OBS: inget await före signIn() — se kommentaren vid nonceRef.
    appleAuth
      .signIn()
      .then(async (result) => {
        if (result.authorization.state !== nonce.state) {
          throw new Error("Apple state matchar inte");
        }

        const response = await fetch("/api/auth/apple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identityToken: result.authorization.id_token,
            // Växlas mot refresh token så att kopplingen kan återkallas vid
            // kontoradering (TN3194). redirectUri måste matcha init exakt.
            authorizationCode: result.authorization.code ?? null,
            redirectUri: getAppleWebRedirectUri(window.location.origin),
            rawNonce: nonce.rawNonce,
            email: result.user?.email ?? null,
            givenName: result.user?.name?.firstName ?? null,
            familyName: result.user?.name?.lastName ?? null,
          }),
        });

        const data = (await response.json()) as AppleAuthResponse;

        if (!response.ok) {
          throw new Error(data.error ?? t("auth.apple.signInFailed"));
        }

        if (data.needsLink) {
          setLinkState({
            identityToken: result.authorization.id_token,
            rawNonce: nonce.rawNonce,
            email: data.email,
            message: data.message,
          });
          setLoading(false);
          return;
        }

        if (!data.loginToken) {
          throw new Error(t("auth.apple.missingToken"));
        }

        await completeLogin(data.loginToken);
      })
      .catch((err: unknown) => {
        const code =
          err && typeof err === "object" && "error" in err
            ? String((err as { error: unknown }).error)
            : null;

        if (!code || !SILENT_APPLE_ERRORS.has(code)) {
          console.error("[apple-web]", err);
          setError(t("auth.apple.signInFailedRetry"));
        }
        setLoading(false);
        // Ny nonce/state inför nästa försök — en nonce används bara en gång.
        void prepare();
      });
  };

  if (linkState) {
    return (
      <LinkAppleAccountForm
        identityToken={linkState.identityToken}
        rawNonce={linkState.rawNonce}
        suggestedEmail={linkState.email}
        message={linkState.message}
        onSuccess={async (loginToken) => {
          await completeLogin(loginToken);
        }}
        onCancel={() => {
          setLinkState(null);
          void prepare();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Apple HIG: svart knapp, Apple-logga, standardtext. Vit kant så att
          den syns mot den mörka kortbakgrunden. */}
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready || loading}
        aria-busy={loading}
        className="w-full min-h-12 py-3.5 px-4 bg-black hover:bg-zinc-900 text-white font-semibold rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed border border-white/20 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <AppleLogo />
            <span>
              {variant === "continue" ? t("auth.apple.continue") : t("auth.apple.signIn")}
            </span>
          </>
        )}
      </button>

      {withDivider && (
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-nordic-highlight/20" />
          <span className="text-[11px] uppercase tracking-wider text-nordic-highlight">
            {t("auth.login.or")}
          </span>
          <div className="h-px flex-1 bg-nordic-highlight/20" />
        </div>
      )}
    </div>
  );
}

/** Apples logga som SVG (U+F8FF-tecknet finns bara i Apples egna typsnitt). */
function AppleLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 814 1000"
      width="16"
      height="19"
      fill="currentColor"
      className="-mt-0.5 shrink-0"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}
