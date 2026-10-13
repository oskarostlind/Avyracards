import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createAppleLoginToken,
  encodeAppleRefreshToken,
  exchangeAppleAuthorizationCode,
  resolveAppleClientIdFromAudience,
  verifyAppleIdentityToken,
} from "@/lib/apple-auth";
import {
  createUserFromApple,
  findUserByAppleSub,
  linkAppleWithCredentials,
} from "@/lib/apple-user";
import { getAppleClientId, isAppleSignInConfigured } from "@/lib/ios-native";
import { logIosNativeServer } from "@/lib/ios-native-server-debug";

const appleAuthSchema = z.object({
  identityToken: z.string().min(1),
  // Engångskod från Sign in with Apple. Växlas mot ett refresh token som vi
  // behöver för att kunna återkalla kopplingen när kontot raderas (TN3194).
  authorizationCode: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  givenName: z.string().optional().nullable(),
  familyName: z.string().optional().nullable(),
  linkEmail: z.string().email().optional(),
  linkPassword: z.string().min(1).optional(),
  // Webbflödet (Sign in with Apple JS): klienten skickar sha256(rawNonce) till
  // Apple och rawNonce hit. Bara den som startade inloggningen känner till
  // rawNonce, så en stulen identity token går inte att spela upp igen.
  rawNonce: z.string().min(16).max(256).optional().nullable(),
  // Måste vara exakt samma redirect URI som webbklienten gav Apple, annars
  // vägrar Apple växla authorizationCode mot refresh token.
  redirectUri: z.string().url().optional().nullable(),
});

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(req: Request) {
  try {
    const configured = isAppleSignInConfigured();
    logIosNativeServer("APPLE_SIGN_IN", "api/auth/apple:POST", "Request received", {
      configured,
    });

    if (!configured) {
      logIosNativeServer(
        "APPLE_SIGN_IN",
        "api/auth/apple:POST",
        "Not configured — missing APPLE_AUTH_* env",
        {},
        "error"
      );
      return NextResponse.json(
        { error: "Sign in with Apple är inte konfigurerat ännu" },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = appleAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
    }

    const rawNonce = parsed.data.rawNonce ?? null;
    const claims = await verifyAppleIdentityToken(parsed.data.identityToken, {
      nonce: rawNonce ? sha256Hex(rawNonce) : null,
    });

    // Vilken klient token utfärdades till: bundle ID (iOS-appen) eller
    // Services ID (webben). Webbtokens kräver nonce — native-flödet har ingen.
    const appleClientId = resolveAppleClientIdFromAudience(claims.aud);
    const isWebClient = appleClientId !== getAppleClientId();
    if (isWebClient && !rawNonce) {
      return NextResponse.json({ error: "Nonce saknas" }, { status: 400 });
    }
    logIosNativeServer("APPLE_SIGN_IN", "api/auth/apple:verify", "Token verified", {
      hasEmail: Boolean(claims.email),
      subPrefix: claims.sub?.slice(0, 8),
      client: isWebClient ? "web" : "native",
    });
    const appleId = claims.sub;
    const tokenEmail =
      typeof claims.email === "string" ? claims.email.toLowerCase() : null;
    const fallbackEmail = parsed.data.email?.toLowerCase() ?? null;
    const resolvedEmail = tokenEmail ?? fallbackEmail;

    if (parsed.data.linkEmail && parsed.data.linkPassword) {
      const user = await linkAppleWithCredentials({
        email: parsed.data.linkEmail,
        password: parsed.data.linkPassword,
        appleId,
        appleEmail: resolvedEmail,
      });

      const loginToken = await createAppleLoginToken(user.id);
      return NextResponse.json({ loginToken, user });
    }

    // Sparas så snart Apple skickar med koden. Kastar aldrig.
    // Lagras med client_id-prefix för webbklienten så att revoke vid
    // kontoradering använder rätt client_id (se encodeAppleRefreshToken).
    const rawRefreshToken = parsed.data.authorizationCode
      ? await exchangeAppleAuthorizationCode(parsed.data.authorizationCode, {
          clientId: appleClientId,
          redirectUri: isWebClient ? parsed.data.redirectUri : null,
        })
      : null;
    const appleRefreshToken = rawRefreshToken
      ? encodeAppleRefreshToken(appleClientId, rawRefreshToken)
      : null;

    const existingAppleUser = await findUserByAppleSub(appleId);
    if (existingAppleUser) {
      if (appleRefreshToken) {
        await prisma.user.update({
          where: { id: existingAppleUser.id },
          data: { appleRefreshToken },
        });
      }

      const loginToken = await createAppleLoginToken(existingAppleUser.id);
      return NextResponse.json({
        loginToken,
        user: {
          id: existingAppleUser.id,
          email: existingAppleUser.email,
          username: existingAppleUser.username,
        },
      });
    }

    if (resolvedEmail) {
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: resolvedEmail },
      });

      if (existingEmailUser) {
        return NextResponse.json({
          needsLink: true,
          email: existingEmailUser.email,
          message:
            "Det finns redan ett konto med denna e-post. Logga in med lösenord för att koppla Apple-ID.",
        });
      }
    }

    if (!resolvedEmail) {
      return NextResponse.json({
        needsLink: true,
        message:
          "Apple delade ingen e-post. Ange ditt befintliga konto för att koppla Apple-ID.",
      });
    }

    const displayName = [parsed.data.givenName, parsed.data.familyName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const user = await createUserFromApple({
      appleId,
      email: resolvedEmail,
      name: displayName || null,
    });

    if (appleRefreshToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { appleRefreshToken },
      });
    }

    const loginToken = await createAppleLoginToken(user.id);
    return NextResponse.json({ loginToken, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logIosNativeServer(
      "APPLE_SIGN_IN",
      "api/auth/apple:catch",
      "Apple auth failed",
      { error: message },
      "error"
    );
    console.error("[APPLE_AUTH]", error);
    return NextResponse.json(
      { error: "Kunde inte logga in med Apple" },
      { status: 500 }
    );
  }
}
