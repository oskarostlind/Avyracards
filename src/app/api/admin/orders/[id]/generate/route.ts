import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Skapar en kort kod (t.ex. "X7F2P1") - undviker tecken som kan förväxlas (I, l, 1, 0, O)
function generateShortCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
      const cardCode = generateShortCode();
      const claimToken = randomBytes(32).toString("hex"); // Säker token för aktivering

      const card = await prisma.card.create({
        data: {
          orderId: order.id,
          cardCode: cardCode,
          claimToken: claimToken,
          status: "UNCLAIMED",
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