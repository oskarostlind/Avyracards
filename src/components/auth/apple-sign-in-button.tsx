"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SignInWithApple } from "@capacitor-community/apple-sign-in";
import { useIsApp } from "@/hooks/useIsApp";
import { isIosDebugEnabled, isIosNativePaymentsEnabled } from "@/lib/ios-native";
import { LinkAppleAccountForm } from "@/components/auth/link-apple-account-form";
import { logIosNativeRuntime } from "@/lib/ios-native-runtime-debug";
import { useT } from "@/i18n/client";

interface AppleSignInButtonProps {
  callbackUrl?: string;
}

interface AppleAuthResponse {
  loginToken?: string;
  needsLink?: boolean;
  email?: string;
  message?: string;
  error?: string;
}

export function AppleSignInButton({ callbackUrl = "/dashboard" }: AppleSignInButtonProps) {
  const t = useT();
  const router = useRouter();
  const isApp = useIsApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [linkState, setLinkState] = useState<{
    identityToken: string;
    email?: string;
    message?: string;
  } | null>(null);

  if (!isApp || !isIosNativePaymentsEnabled()) {
    return null;
  }

  const completeLogin = async (loginToken: string) => {
    logIosNativeRuntime({
      scope: "APPLE_SIGN_IN",
      location: "apple-sign-in-button.tsx:completeLogin",
      message: "Creating session via credentials",
    });

    const result = await signIn("credentials", {
      appleLoginToken: loginToken,
      redirect: false,
    });

    if (result?.error) {
      logIosNativeRuntime({
        scope: "APPLE_SIGN_IN",
        location: "apple-sign-in-button.tsx:completeLogin",
        message: "signIn credentials failed",
        data: { error: result.error },
        level: "error",
        hypothesisId: "D",
      });
      throw new Error(t("auth.apple.sessionFailed"));
    }

    logIosNativeRuntime({
      scope: "APPLE_SIGN_IN",
      location: "apple-sign-in-button.tsx:completeLogin",
      message: "Session created, redirecting",
      data: { callbackUrl },
    });

    router.push(callbackUrl);
    router.refresh();
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    setError("");

    logIosNativeRuntime({
      scope: "APPLE_SIGN_IN",
      location: "apple-sign-in-button.tsx:handleAppleSignIn",
      message: "Starting native authorize",
      hypothesisId: "A",
    });

    try {
      const appleResult = await SignInWithApple.authorize({
        clientId: "se.avyracards.app",
        redirectURI: "https://avyracards.se",
        scopes: "email name",
      });

      logIosNativeRuntime({
        scope: "APPLE_SIGN_IN",
        location: "apple-sign-in-button.tsx:nativeAuthorize",
        message: "Native authorize succeeded",
        data: {
          hasIdentityToken: Boolean(appleResult.response.identityToken),
          hasEmail: Boolean(appleResult.response.email),
        },
        hypothesisId: "A",
      });

      const response = await fetch("/api/auth/apple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identityToken: appleResult.response.identityToken,
          // Skickas vidare så att servern kan växla den mot ett refresh token
          // och kunna återkalla Apple-kopplingen vid kontoradering (TN3194).
          authorizationCode: appleResult.response.authorizationCode ?? null,
          email: appleResult.response.email,
          givenName: appleResult.response.givenName,
          familyName: appleResult.response.familyName,
        }),
      });

      const data = (await response.json()) as AppleAuthResponse;

      logIosNativeRuntime({
        scope: "APPLE_SIGN_IN",
        location: "apple-sign-in-button.tsx:apiResponse",
        message: "Auth API response",
        data: {
          status: response.status,
          ok: response.ok,
          needsLink: data.needsLink,
          hasLoginToken: Boolean(data.loginToken),
          error: data.error,
        },
        hypothesisId: response.ok ? "C" : "B",
        level: response.ok ? "info" : "error",
      });

      if (!response.ok) {
        throw new Error(data.error ?? t("auth.apple.signInFailed"));
      }

      if (data.needsLink) {
        setLinkState({
          identityToken: appleResult.response.identityToken,
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
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logIosNativeRuntime({
        scope: "APPLE_SIGN_IN",
        location: "apple-sign-in-button.tsx:catch",
        message: "Apple sign-in failed",
        data: { error: message },
        level: "error",
      });
      console.error(err);
      setError(
        isIosDebugEnabled()
          ? t("auth.apple.signInFailedDebug", { message })
          : t("auth.apple.signInFailedRetry")
      );
      setLoading(false);
    }
  };

  if (linkState) {
    return (
      <LinkAppleAccountForm
        identityToken={linkState.identityToken}
        suggestedEmail={linkState.email}
        message={linkState.message}
        onSuccess={async (loginToken) => {
          await completeLogin(loginToken);
        }}
        onCancel={() => setLinkState(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleAppleSignIn}
        disabled={loading}
        className="w-full py-3.5 px-4 bg-black hover:bg-zinc-900 text-white font-bold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <>
            <span aria-hidden="true"></span>
            {t("auth.apple.continue")}
          </>
        )}
      </button>
    </div>
  );
}
