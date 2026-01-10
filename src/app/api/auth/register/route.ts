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
  
  // Tillåt dessa fält från frontend (används vid köp)
  isPremium: z.boolean().optional(),
  stripeSessionId: z.string().optional(),
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
      stripeSessionId
    } = parsed.data;

    // --- NORMALISERING ---
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // --- 🛠️ SANDBOX MAGIC (DEV ONLY) 🛠️ ---
    // Om vi kör lokalt och mailen är "test@test.se", radera gamla användaren först.
    if (process.env.NODE_ENV === "development" && normalizedEmail === "test@test.se") {
      console.log("🧪 DEV MODE: Cleaning up old test user (test@test.se)...");
      try {
        await prisma.user.deleteMany({
          where: { 
            OR: [
              { email: "test@test.se" },
              { username: normalizedUsername } // Rensa även om användarnamnet krockar för testkontot
            ]
          }
        });
        console.log("✨ Cleaned! Creating new test user.");
      } catch (e) {
        console.log("⚠️ No previous test user found or cleanup failed (ignoring).");
      }
    }
    // ----------------------------------------

    // Kolla om användare redan finns (för alla andra fall)
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

    // --- AUTO-VERIFIERING VID KÖP ---
    // Om användaren kommer från ett betalt köp (stripeSessionId finns), litar vi på e-posten.
    const isVerifiedByPurchase = !!stripeSessionId;

    // 1. Skapa användaren
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        passwordHash,
        verificationToken: isVerifiedByPurchase ? null : verificationToken,
        emailVerified: isVerifiedByPurchase ? new Date() : null,
        profileMode: prismaProfileMode,
      },
    });

    // 2. Skicka mail (ENDAST om INTE verifierad via köp)
    if (!isVerifiedByPurchase) {
      try {
        await sendVerificationEmail(user.email, verificationToken);
      } catch (emailError: any) {
        console.error("[register] Mail misslyckades, rullar tillbaka användare:", emailError.message);
        
        // VIKTIGT: Ta bort användaren eftersom mailet misslyckades
        await prisma.user.delete({ where: { id: user.id } });

        return NextResponse.json(
          { 
            error: "Kunde inte skicka verifieringsmail. Kontrollera att din e-postadress är korrekt.",
            details: emailError.message 
          },
          { status: 500 }
        );
      }
    } else {
       console.log(`[register] User ${user.email} auto-verified due to purchase session.`);
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