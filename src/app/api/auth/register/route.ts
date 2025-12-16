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

    // --- NORMALISERING ---
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

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

    const passwordHash = await hashPassword(password);
    const verificationToken = randomUUID();
    const prismaProfileMode =
      profileModeRaw === "business" ? "BUSINESS" : "SOCIAL";

    // 1. Skapa användaren
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        verificationToken,
        profileMode: prismaProfileMode,
      },
    });

    // 2. Försök skicka mail (med felhantering/rollback)
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError: any) {
      console.error("[register] Mail misslyckades, rullar tillbaka användare:", emailError.message);
      
      // VIKTIGT: Ta bort användaren eftersom mailet misslyckades
      await prisma.user.delete({ where: { id: user.id } });

      return NextResponse.json(
        { 
          error: "Kunde inte skicka verifieringsmail. Kontrollera att din e-postadress är korrekt.",
          details: emailError.message // Skickar med teknisk orsak för debugging (ta bort i prod sen)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });

  } catch (err) {
    console.error("[register] Kritisk krasch:", err);
    return NextResponse.json(
      { error: "Något gick fel vid registrering. Försök igen senare." },
      { status: 500 }
    );
  }
}