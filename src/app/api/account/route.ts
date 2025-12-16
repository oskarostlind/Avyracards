import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const accountSchema = z.object({
  marketingConsent: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  hideFromSearch: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    // FIX: Använd safeParse för att hantera valideringsfel snyggt
    const result = accountSchema.safeParse(body);

    if (!result.success) {
      // Returnera 400 Bad Request istället för att krascha med 500
      return NextResponse.json(
        { error: "Ogiltig data", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Account update error:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera kontoinställningar" },
      { status: 500 }
    );
  }
}