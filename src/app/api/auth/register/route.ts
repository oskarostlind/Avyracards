import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

export const runtime = "nodejs";

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Användarnamnet måste vara minst 3 tecken.")
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Användarnamnet får bara innehålla bokstäver, siffror och underscore."
    ),
  email: z.string().email("Ogiltig e-postadress."),
  password: z.string().min(6, "Lösenordet måste vara minst 6 tecken."),
  profileMode: z.enum(["social", "business"]).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Ogiltig input." },
        { status: 400 }
      );
    }

    const {
      username,
      email,
      password,
      profileMode: profileModeRaw = "social",
    } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.trim();

    // Kolla om användare redan finns
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Användarnamn eller e-post används redan." },
        { status: 400 }
      );
    }

    // Hasha lösenordet
    const passwordHash = await hashPassword(password);

    // Skapa verifieringstoken
    const verificationToken = randomUUID();

    // Mappa profileMode till Prisma-enum
    const prismaProfileMode =
      profileModeRaw === "business" ? "BUSINESS" : "SOCIAL";

    // Skapa användaren
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,               // ✅ rätt fältnamn
        verificationToken,
        profileMode: prismaProfileMode, // ✅ sparar SOCIAL/BUSINESS
      },
    });

    // Skicka verifieringsmail via Strato (nodemailer)
    await sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register] Fel vid registrering/verifieringsmail:", err);
    return NextResponse.json(
      { error: "Något gick fel vid registrering. Försök igen senare." },
      { status: 500 }
    );
  }
}
