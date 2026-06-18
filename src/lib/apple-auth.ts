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
