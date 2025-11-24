import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email"; // ⬅ Lägg till denna import

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Kontrollera användarnamn, e-post och lösenord" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: username.toLowerCase() }, { email }] },
    });

    if (exists) {
      return NextResponse.json(
        { error: "Användarnamnet eller e-post används redan" },
        { status: 400 }
      );
    }

    const verificationToken = randomUUID();

    await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        verificationToken,
        emailVerified: null,
      },
    });

    // Skicka verifieringsmail via Strato (nodemailer)
    await sendVerificationEmail(email.toLowerCase(), verificationToken);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[register] Fel vid registrering/verifieringsmail:", err);
    return NextResponse.json(
      { error: "Något gick fel vid registrering. Försök igen senare." },
      { status: 500 }
    );
  }
}
