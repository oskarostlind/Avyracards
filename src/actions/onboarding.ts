"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Eller din auth-helper
import { revalidatePath } from "next/cache";

export async function completeOnboarding() {
  const session = await auth();
  
  if (!session?.user?.email) {
    return { error: "Inte inloggad" };
  }

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data: { hasSeenOnboarding: true },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Kunde inte spara status." };
  }
}