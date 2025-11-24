import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { randomUUID } from "crypto";
// @ts-ignore: no types available for 'resend'
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
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

  // Skicka verifieringsmail via Resend
  await resend.emails.send({
    from: "SocialCard <noreply@socialcard.app>",
    to: email,
    subject: "Verifiera ditt konto",
    html: `
      <h2>Verifiera din e-post</h2>
      <p>Klicka på länken nedan för att verifiera ditt konto:</p>
      <a href="${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${verificationToken}">
        Klicka här för att verifiera ditt konto
      </a>
    `,
  });

  return NextResponse.json({ ok: true });
}
