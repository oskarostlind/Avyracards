"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs"; 
import { redirect } from "next/navigation";

// 1. BEGÄR ÅTERSTÄLLNING (Oförändrad, men inkluderad för komplett fil)
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return { success: true, message: "Om adressen finns har en länk skickats." };
  }

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

  console.log("========================================");
  console.log("ÅTERSTÄLLNINGSLÄNK (Klicka här):");
  console.log(resetLink);
  console.log("========================================");

  // Här kan du lägga in din resend-kod senare
  
  return { success: true, message: "Kolla din mail (eller serverkonsolen) för länken." };
}

// 2. UTFÖR ÅTERSTÄLLNING (Uppdaterad med validering)
export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string; // NYTT FÄLT

  if (!token || !password || !confirmPassword) {
    return { error: "Alla fält måste fyllas i." };
  }

  // NY VALIDERING: Kolla att lösenorden matchar
  if (password !== confirmPassword) {
    return { error: "Lösenorden matchar inte." };
  }

  if (password.length < 6) {
      return { error: "Lösenordet måste vara minst 6 tecken." };
  }

  // Hitta användare med giltig token
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return { error: "Ogiltig eller utgången länk. Begär en ny återställning." };
  }

  const hashedPassword = await hash(password, 12);

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