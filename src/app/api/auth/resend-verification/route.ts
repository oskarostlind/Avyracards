import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

export const runtime = "nodejs";

const ResendSchema = z.object({
  email: z.string().email("Ogiltig e-postadress"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = ResendSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Ogiltig e-postadress" }, { status: 400 });
    }

    const email = result.data.email.toLowerCase().trim();

    // Hitta användaren
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Av säkerhetsskäl: Berätta inte om användaren finns eller ej.
    // Om användaren inte finns, eller redan är verifierad, låtsas vi bara att det gick bra.
    if (!user) {
      return NextResponse.json({ ok: true }); 
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true }); // Redan klar, gör inget
    }

    // Skicka mailet igen (använder samma token som redan finns i DB)
    // Om token saknas (gammal user), borde vi kanske generera en ny, men vi kör på befintlig först.
    if (user.verificationToken) {
      await sendVerificationEmail(user.email, user.verificationToken);
    } else {
        // Fallback: Om token saknas av någon anledning
        return NextResponse.json({ error: "Kunde inte hitta verifieringsdata. Kontakta support." }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[resend-verification] Error:", error);
    return NextResponse.json({ error: "Kunde inte skicka mailet." }, { status: 500 });
  }
}