import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
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
    const data = accountSchema.parse(body);

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