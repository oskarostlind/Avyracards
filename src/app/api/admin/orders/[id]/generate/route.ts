import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes, randomInt } from "crypto";

// Skapar en kort kod (t.ex. "X7F2P1") - använder crypto för bättre slump
function generateShortCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let code = "";
  for (let i = 0; i < length; i++) {
    // randomInt är säkrare och ger jämnare fördelning än Math.random()
    const randomIndex = randomInt(0, chars.length);
    code += chars.charAt(randomIndex);
  }
  return code;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Dubbelkoll: Endast Admin får skapa kort
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { cards: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Räkna ut hur många kort som saknas
    const cardsToCreate = order.quantity - order.cards.length;

    if (cardsToCreate <= 0) {
      return NextResponse.json({ error: "Korten är redan skapade" }, { status: 400 });
    }

    // Skapa korten i databasen
    const newCards = [];
    
    for (let i = 0; i < cardsToCreate; i++) {
      let cardCode = "";
      let isUnique = false;
      let attempts = 0;

      // 1. Kollisionsskydd: Loopa tills vi hittar en kod som inte finns
      while (!isUnique && attempts < 10) {
        cardCode = generateShortCode();
        
        // Kolla om koden redan finns i DB
        const existing = await prisma.card.findUnique({
          where: { cardCode },
        });

        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error("Kunde inte generera en unik kod efter flera försök. Försök igen.");
      }

      const claimToken = randomBytes(32).toString("hex"); // Säker token för aktivering

      const card = await prisma.card.create({
        data: {
          orderId: order.id,
          cardCode: cardCode,
          claimToken: claimToken,
          status: "UNCLAIMED",
          // Normalvägen (Stripe-webhooken) skapar korten med material/färg
          // från produktmetadatan och kopplar köparen. Den datan finns inte
          // sparad på ordern, så här kan vi bara återställa ägarkopplingen —
          // material/färg lämnas tomma och visas som "Ej angivet" i admin.
          assignedUserId: order.userId,
        },
      });
      newCards.push(card);
    }

    return NextResponse.json({ success: true, created: newCards.length });
  } catch (error) {
    console.error("Generate cards error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}