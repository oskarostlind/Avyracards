"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs"; // Eller din hash-funktion från @/lib/password
import { redirect } from "next/navigation";

// 1. BEGÄR ÅTERSTÄLLNING
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    // Av säkerhetsskäl, säg ändå "Om e-posten finns har vi skickat en länk"
    return { success: true, message: "Om adressen finns har en länk skickats." };
  }

  // Generera token
  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 3600000); // 1 timme

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: expiry,
    },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  // --- HÄR SKA DU EGENLIGEN SKICKA MAILET ---
  // Tills vidare: Logga länken i server-konsolen så du kan klicka på den.
  console.log("========================================");
  console.log("ÅTERSTÄLLNINGSLÄNK (Klicka här):");
  console.log(resetLink);
  console.log("========================================");

  // Om du har Resend konfigurerat, avkommentera detta:
  /*
  await resend.emails.send({
    from: "Avyra <no-reply@avyracards.se>",
    to: email,
    subject: "Återställ ditt lösenord",
    html: `<p>Klicka här för att återställa: <a href="${resetLink}">${resetLink}</a></p>`
  });
  */

  return { success: true, message: "Kolla din mail (eller serverkonsolen) för länken." };
}

// 2. UTFÖR ÅTERSTÄLLNING
export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) {
    return { error: "Token eller lösenord saknas." };
  }

  // Hitta användare med giltig token
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { gt: new Date() }, // Måste vara framtiden
    },
  });

  if (!user) {
    return { error: "Ogiltig eller utgången länk." };
  }

  // Hasha nya lösenordet
  const hashedPassword = await hash(password, 12);

  // Uppdatera user & rensa token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    },
  });

  redirect("/login?reset=success");
}