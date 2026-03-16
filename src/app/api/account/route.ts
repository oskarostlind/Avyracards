import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/password"; // Antar att dessa finns baserat på tidigare kod

const accountSchema = z.object({
  marketingConsent: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  hideFromSearch: z.boolean().optional(),
  notifyOnProfileView: z.boolean().optional(),
  notifyOnLinkClick: z.boolean().optional(),
  notifyOnContactSave: z.boolean().optional(),
  username: z
    .string()
    .min(3, "Minst 3 tecken")
    .regex(/^[a-zA-Z0-9_]+$/, "Endast bokstäver, siffror och understreck")
    .optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Minst 6 tecken").optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = accountSchema.safeParse(body);

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
      notifyOnProfileView,
      notifyOnLinkClick,
      notifyOnContactSave,
      ...settings
    } = result.data;

    // Hämta nuvarande användare för verifiering
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "Användare hittades inte" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...settings };
    if (notifyOnProfileView !== undefined) updateData.notifyOnProfileView = notifyOnProfileView;
    if (notifyOnLinkClick !== undefined) updateData.notifyOnLinkClick = notifyOnLinkClick;
    if (notifyOnContactSave !== undefined) updateData.notifyOnContactSave = notifyOnContactSave;

    // --- 1. HANTERA ANVÄNDARNAMN ---
    if (username && username !== user.username) {
      // Kolla om det är ledigt
      const existing = await prisma.user.findUnique({
        where: { username },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: "Användarnamnet är upptaget." }, 
          { status: 409 }
        );
      }
      updateData.username = username.toLowerCase();
    }

    // --- 2. HANTERA LÖSENORD ---
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Du måste ange nuvarande lösenord för att byta." }, 
          { status: 400 }
        );
      }

      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "Detta konto använder extern inloggning (Google etc)." }, 
          { status: 400 }
        );
      }

      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Felaktigt nuvarande lösenord." }, 
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
      { error: "Kunde inte uppdatera kontoinställningar" },
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

    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Kunde inte radera kontot." },
      { status: 500 }
    );
  }
}