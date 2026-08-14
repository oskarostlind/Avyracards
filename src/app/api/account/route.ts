import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revokeAppleToken } from "@/lib/apple-auth";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateClaimToken } from "@/lib/card-claim";
import { expireGoogleWalletPass } from "@/lib/wallet/google";
import { getT } from "@/i18n/server";
import type { Translator } from "@/i18n";

// Byggs per request — se kommentaren i api/auth/register/route.ts.
const buildAccountSchema = (t: Translator) =>
  z.object({
    marketingConsent: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    hideFromSearch: z.boolean().optional(),
    notifyOnProfileView: z.boolean().optional(),
    notifyOnLinkClick: z.boolean().optional(),
    notifyOnContactSave: z.boolean().optional(),
    username: z
      .string()
      .min(3, t("api.register.usernameMin"))
      .regex(/^[a-zA-Z0-9_]+$/, t("api.account.usernamePattern"))
      .optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, t("api.register.passwordMin")).optional(),
  });

export async function PATCH(req: Request) {
  const t = getT();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = buildAccountSchema(t).safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Ogiltig data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { 
      currentPassword, 
      newPassword, 
      username, 
      ...settings 
    } = result.data;

    // Hämta nuvarande användare för verifiering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: t("api.userNotFound") }, { status: 404 });
    }

    const updateData: any = { ...settings };

    // --- 1. HANTERA ANVÄNDARNAMN ---
    if (username && username !== user.username) {
      // Kolla om det är ledigt
      const existing = await prisma.user.findUnique({
        where: { username },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: t("api.account.usernameTaken") }, 
          { status: 409 }
        );
      }
      updateData.username = username.toLowerCase();
    }

    // --- 2. HANTERA LÖSENORD ---
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: t("api.account.currentPasswordRequired") }, 
          { status: 400 }
        );
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { error: t("api.account.externalLogin") }, 
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: t("api.account.wrongCurrentPassword") }, 
          { status: 403 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    // --- UTFÖR UPPDATERING ---
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { error: t("api.account.updateFailed") },
      { status: 500 }
    );
  }
}

// --- RADERA KONTO ---
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Apple TN3194 / Guideline 5.1.1(v): Sign in with Apple-kopplingen måste
    // återkallas som en del av raderingen, annars ligger AvyraCards kvar under
    // "Logga in med Apple" i användarens iPhone-inställningar. Görs före
    // raderingen eftersom vi behöver refresh-tokenet, men får aldrig avbryta
    // raderingen om Apple svarar med fel.
    const accountToDelete = await prisma.user.findUnique({
      where: { id: userId },
      select: { appleRefreshToken: true },
    });

    if (accountToDelete?.appleRefreshToken) {
      await revokeAppleToken(accountToDelete.appleRefreshToken);
    }

    // Fysiska kort ska kunna återanvändas efter att ägaren raderat sitt konto.
    // Utan detta blir kortet kvar som CLAIMED med assignedUserId = null (Prisma
    // sätter den till null eftersom relationen är valfri) och går aldrig att
    // claima igen — kortet blir permanent obrukbart.
    const ownedCards = await prisma.card.findMany({
      where: { assignedUserId: userId },
      select: { id: true },
    });

    await prisma.$transaction([
      // Ny claimToken per kort, annars skulle den gamla ägarens sparade
      // aktiveringslänk fungera igen efter att kortet frigjorts.
      ...ownedCards.map((card) =>
        prisma.card.update({
          where: { id: card.id },
          data: {
            status: "UNCLAIMED",
            assignedUserId: null,
            claimedAt: null,
            claimToken: generateClaimToken(),
          },
        })
      ),
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    // Wallet lifecycle: passet lever kvar i användarens telefon efter att
    // kontot raderats, med en QR-kod mot en profil som inte längre finns.
    // Markera det som utgånget. Görs efter raderingen och kan inte kasta —
    // ett Google-fel får inte göra att kontoraderingen ser ut att misslyckas
    // när den faktiskt är genomförd (5.1.1(v) kräver att den fungerar).
    await expireGoogleWalletPass(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Kunde inte radera kontot." },
      { status: 500 }
    );
  }
}