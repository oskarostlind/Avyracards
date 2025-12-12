import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import crypto from "crypto";

function generateShortCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (event.type === "checkout.session.completed") {
    
    // --- IDEMPOTENCY CHECK (NYTT) ---
    // Kolla om vi redan har skapat en order för denna session
    const existingOrder = await prisma.order.findUnique({
      where: {
        stripeSessionId: session.id,
      },
    });

    if (existingOrder) {
      console.log(`⚠️ Order already processed for session ${session.id}. Skipping.`);
      return new NextResponse(null, { status: 200 });
    }
    // --------------------------------

    // Hämta metadata
    const quantity = parseInt(session.metadata?.quantity || "1");
    const material = session.metadata?.material || "plastic";
    const color = session.metadata?.color || "black";
    const design = session.metadata?.design || "minimal";
    const customerType = session.metadata?.customerType === "company" ? "COMPANY" : "PRIVATE";
    
    // 1. Skapa Order
    const order = await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        amountTotal: session.amount_total || 0,
        currency: session.currency || "sek",
        status: "PAID",
        customerEmail: session.customer_details?.email || "",
        customerType: customerType,
        companyName: session.custom_fields?.find((f) => f.key === "company_name")?.text?.value,
        quantity: quantity,
      },
    });

    // 2. Generera Card Slots
    const cardsToCreate = [];
    
    for (let i = 0; i < quantity; i++) {
      const cardCode = generateShortCode(); 
      const claimToken = crypto.randomBytes(32).toString("hex");

      cardsToCreate.push({
        orderId: order.id,
        cardCode: cardCode,
        claimToken: claimToken,
        status: "UNCLAIMED" as const,
        
        material: material,
        colorOption: color,
        designTemplate: design,
      });
    }

    await prisma.card.createMany({
      data: cardsToCreate,
    });

    console.log(`✅ ${quantity} cards (${material}/${color}) generated for Order ${order.id}.`);
  }

  return new NextResponse(null, { status: 200 });
}