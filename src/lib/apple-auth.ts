import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { SignJWT } from "jose";
import { getAppleClientId } from "@/lib/ios-native";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export interface AppleIdentityClaims extends JWTPayload {
  sub: string;
  email?: string;
  email_verified?: boolean | string;
  is_private_email?: boolean | string;
}

export async function verifyAppleIdentityToken(
  identityToken: string
): Promise<AppleIdentityClaims> {
  const clientId = getAppleClientId();

  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });

  if (!payload.sub) {
    throw new Error("Apple identity token saknar sub");
  }

  return payload as AppleIdentityClaims;
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
export async function createAppleClientSecret(): Promise<string | null> {
  const keyId = process.env.APPLE_AUTH_KEY_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const rawKey = process.env.APPLE_AUTH_PRIVATE_KEY;

  if (!keyId || !teamId || !rawKey) {
    return null;
  }

  const { importPKCS8 } = await import("jose");
  const privateKey = await importPKCS8(rawKey.replace(/\\n/g, "\n"), "ES256");

  return new SignJWT({ sub: getAppleClientId() })
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

export async function revokeAppleToken(refreshToken: string): Promise<boolean> {
  try {
    const clientSecret = await createAppleClientSecret();
    if (!clientSecret) {
      console.warn("[apple] Kan inte återkalla token — client secret saknas");
      return false;
    }

    const response = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getAppleClientId(),
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
  authorizationCode: string
): Promise<string | null> {
  try {
    const clientSecret = await createAppleClientSecret();
    if (!clientSecret) return null;

    const response = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: getAppleClientId(),
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { refresh_token?: string };
    return data.refresh_token ?? null;
  } catch (error) {
    console.error("[apple] Kodväxling misslyckades:", error);
    return null;
  }
}
