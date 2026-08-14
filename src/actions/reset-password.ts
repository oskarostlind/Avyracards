"use server";

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs"; 
import { redirect } from "next/navigation";
import { sendPasswordResetEmail } from "@/lib/email"; // <--- IMPORTERA HÄR
import { getLocale } from "@/i18n/server";

// 1. BEGÄR ÅTERSTÄLLNING
export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Av säkerhetsskäl säger vi alltid "Om adressen finns..." även om den inte gör det
  if (!user) {
    return { success: true, message: getT()("api.reset.linkSentIfExists") };
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

  // Logga för dev (bra att ha kvar)
  console.log("Dev reset link:", resetLink);

  // --- HÄR ÄR FIXEN: SKICKA MAILET PÅ RIKTIGT ---
  const emailResult = await sendPasswordResetEmail(user.email, resetLink, getLocale());

  if (!emailResult.success) {
      return { error: getT()("api.reset.sendFailed") };
  }
  
  return { success: true, message: getT()("api.reset.linkSentIfExists") };
}

// 2. UTFÖR ÅTERSTÄLLNING (Oförändrad, men med för tydlighetens skull)
export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !password || !confirmPassword) {
    return { error: getT()("api.reset.allFieldsRequired") };
  }

  if (password !== confirmPassword) {
    return { error: getT()("api.reset.passwordsDoNotMatch") };
  }

  if (password.length < 6) {
      return { error: getT()("api.reset.passwordTooShort") };
  }

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return { error: getT()("api.reset.invalidOrExpired") };
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