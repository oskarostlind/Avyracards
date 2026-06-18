import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createAppleLoginToken,
  verifyAppleIdentityToken,
} from "@/lib/apple-auth";
import {
  createUserFromApple,
  findUserByAppleSub,
  linkAppleWithCredentials,
} from "@/lib/apple-user";
import { isAppleSignInConfigured } from "@/lib/ios-native";
import { logIosNativeServer } from "@/lib/ios-native-server-debug";

const appleAuthSchema = z.object({
  identityToken: z.string().min(1),
  email: z.string().email().optional().nullable(),
  givenName: z.string().optional().nullable(),
  familyName: z.string().optional().nullable(),
  linkEmail: z.string().email().optional(),
  linkPassword: z.string().min(1).optional(),
});

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

    const claims = await verifyAppleIdentityToken(parsed.data.identityToken);
    logIosNativeServer("APPLE_SIGN_IN", "api/auth/apple:verify", "Token verified", {
      hasEmail: Boolean(claims.email),
      subPrefix: claims.sub?.slice(0, 8),
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

    const existingAppleUser = await findUserByAppleSub(appleId);
    if (existingAppleUser) {
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
