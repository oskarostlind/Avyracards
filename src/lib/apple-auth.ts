import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { SignJWT } from "jose";
import {
  getAppleAllowedAudiences,
  getAppleClientId,
  getAppleWebServicesId,
} from "@/lib/ios-native";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export interface AppleIdentityClaims extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
}

export interface VerifyAppleIdentityTokenOptions {
  /**
   * Förväntad nonce. Webbflödet (Sign in with Apple JS) skickar in nonce rått
   * och Apple lägger tillbaka den oförändrad i token — ingen hashning, till
   * skillnad från vissa native-SDK:er. Native-flödet skickar ingen nonce.
   */
  nonce?: string | null;
}

export async function verifyAppleIdentityToken(
  identityToken: string,
  options: VerifyAppleIdentityTokenOptions = {}
): Promise<AppleIdentityClaims> {
  // iOS-appen ger aud = bundle ID, webben ger aud = Services ID. Båda är
  // våra egna klienter i samma App ID-grupp, så båda godtas.
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: getAppleAllowedAudiences(),
  });

  if (!payload.sub) {
    throw new Error("Apple identity token saknar sub");
  }

  if (options.nonce !== undefined && options.nonce !== null) {
    if (payload.nonce !== options.nonce) {
      throw new Error("Apple identity token har fel nonce");
    }
  }

  return payload as AppleIdentityClaims;
}

/**
 * Vilken av våra Apple-klienter token utfärdades till. Styr vilket client_id
 * som ska användas vid kodväxling och revoke — en refresh token från webben
 * (Services ID) kan inte återkallas med bundle ID:t och vice versa.
 */
export function resolveAppleClientIdFromAudience(
  aud: string | string[] | undefined
): string {
  const audiences = Array.isArray(aud) ? aud : aud ? [aud] : [];
  const webId = getAppleWebServicesId();
  if (webId && audiences.includes(webId)) {
    return webId;
  }
  return getAppleClientId();
}

/**
 * Refresh token sparas som "<client_id>|<token>" så att vi vet vilken klient
 * den hör till när kontot raderas — utan schemaändring. Äldre värden utan
 * prefix kommer alltid från iOS-appen och tolkas som bundle ID.
 * Apples refresh tokens innehåller aldrig "|" (bara [A-Za-z0-9._-]).
 */
const REFRESH_TOKEN_SEPARATOR = "|";

export function encodeAppleRefreshToken(clientId: string, refreshToken: string): string {
  // Bundle ID:t lagras som förut (utan prefix) så att befintliga rader och nya
  // native-rader ser likadana ut.
  if (clientId === getAppleClientId()) {
    return refreshToken;
  }
  return `${clientId}${REFRESH_TOKEN_SEPARATOR}${refreshToken}`;
}

export function decodeAppleRefreshToken(stored: string): {
  clientId: string;
  refreshToken: string;
} {
  const index = stored.indexOf(REFRESH_TOKEN_SEPARATOR);
  if (index <= 0) {
    return { clientId: getAppleClientId(), refreshToken: stored };
  }
  return {
    clientId: stored.slice(0, index),
    refreshToken: stored.slice(index + REFRESH_TOKEN_SEPARATOR.length),
  };
}

export async function createAppleLoginToken(userId: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET saknas");
  }

  const key = new TextEncoder().encode(secret);

  return new SignJWT({ purpose: "apple-login", userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(key);
}

export async function verifyAppleLoginToken(token: string): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET saknas");
  }

  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });

  if (payload.purpose !== "apple-login" || typeof payload.userId !== "string") {
    throw new Error("Ogiltig Apple login-token");
  }

  return payload.userId;
}


/**
 * Apple TN3194: när en användare raderar sitt konto måste appen anropa Apples
 * revoke-endpoint så att Sign in with Apple-kopplingen upphör. Görs det inte
 * ligger kontot kvar under "Logga in med Apple" i iPhonens inställningar, och
 * Apple har avslagit appar av just det skälet under 5.1.1(v).
 *
 * Kräver ett client secret (samma ES256-JWT som token-utbytet) och det
 * refresh token vi sparade vid första inloggningen. Saknas något av dem
 * returneras false — kontoraderingen får aldrig blockeras av att Apple är nere.
 */
export async function createAppleClientSecret(
  clientId: string = getAppleClientId()
): Promise<string | null> {
  const keyId = process.env.APPLE_AUTH_KEY_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const rawKey = process.env.APPLE_AUTH_PRIVATE_KEY;

  if (!keyId || !teamId || !rawKey) {
    return null;
  }

  const { importPKCS8 } = await import("jose");
  const privateKey = await importPKCS8(rawKey.replace(/\\n/g, "\n"), "ES256");

  // sub måste vara samma client_id som anropet gäller (bundle ID eller Services ID).
  return new SignJWT({ sub: clientId })
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

export async function revokeAppleToken(storedRefreshToken: string): Promise<boolean> {
  try {
    const { clientId, refreshToken } = decodeAppleRefreshToken(storedRefreshToken);
    const clientSecret = await createAppleClientSecret(clientId);
    if (!clientSecret) {
      console.warn("[apple] Kan inte återkalla token — client secret saknas");
      return false;
    }

    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token: refreshToken,
        token_type_hint: "refresh_token",
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[apple] Token revoke misslyckades:", error);
    return false;
  }
}


/**
 * Byter Apples engångskod (authorizationCode) mot ett refresh token. Apple ger
 * bara ut det här tokenet vid själva inloggningen — sparas det inte då går det
 * aldrig att återkalla kopplingen vid kontoradering (TN3194).
 *
 * Returnerar null i stället för att kasta: en misslyckad kodväxling får aldrig
 * få inloggningen att fallera, den är en bonus ovanpå identityToken-verifieringen.
 */
export async function exchangeAppleAuthorizationCode(
  authorizationCode: string,
  options: {
    /** Klienten som startade inloggningen (bundle ID eller Services ID). */
    clientId?: string;
    /**
     * Krävs för webbflödet: Apple kräver att redirect_uri är exakt samma som
     * i auktoriseringsanropet. Native-flödet skickar ingen.
     */
    redirectUri?: string | null;
  } = {}
): Promise<string | null> {
  try {
    const clientId = options.clientId ?? getAppleClientId();
    const clientSecret = await createAppleClientSecret(clientId);
    if (!clientSecret) return null;

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
    });
    if (options.redirectUri) {
      params.set("redirect_uri", options.redirectUri);
    }

    const response = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { refresh_token?: string };
    return data.refresh_token ?? null;
  } catch (error) {
    console.error("[apple] Kodväxling misslyckades:", error);
    return null;
  }
}
