import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth"; // Din auth-helper

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { cardCode, claimToken } = await req.json();

    if (!cardCode) {
      return NextResponse.json({ message: "Card code missing" }, { status: 400 });
    }

    // 1. Hämta kortet och verifiera
    const card = await prisma.card.findUnique({
      where: { cardCode },
    });

    if (!card) {
      return NextResponse.json({ message: "Kortet hittades inte" }, { status: 404 });
    }

    if (card.status !== "UNCLAIMED") {
      return NextResponse.json({ message: "Kortet är redan aktiverat" }, { status: 400 });
    }

    // Säkerhetskoll (om vi använder token)
    // Om du skickade med token i URL:en, kolla den här.
    if (claimToken && card.claimToken !== claimToken) {
       // Obs: I produktion kanske du inte vill avslöja exakt vad som är fel
       return NextResponse.json({ message: "Ogiltig säkerhetstoken" }, { status: 403 });
    }

    // 2. Uppdatera kortet
    await prisma.card.update({
      where: { id: card.id },
      data: {
        status: "CLAIMED",
        assignedUserId: session.user.id,
        claimedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[CLAIM_ERROR]", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}