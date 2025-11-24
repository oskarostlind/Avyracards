// src/app/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Säkerställ att vi alltid har en giltig bas-URL
    const baseFallback =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://socialcard.se";

    const currentUrl = new URL(req.url, baseFallback);
    const { searchParams, origin } = currentUrl;

    const token = searchParams.get("token");

    if (!token) {
      const redirectUrl = new URL("/login?error=invalid-token", origin);
      return NextResponse.redirect(redirectUrl);
    }

    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      const redirectUrl = new URL("/login?error=invalid-token", origin);
      return NextResponse.redirect(redirectUrl);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: null,
        emailVerified: new Date(),
      },
    });

    const redirectUrl = new URL("/login?verified=1", origin);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("[verify] Error verifying token:", error);
    // Som fallback – visa en enkel textrespons istället för helt tom 500
    return new NextResponse("Något gick fel vid verifieringen.", {
      status: 500,
    });
  }
}
