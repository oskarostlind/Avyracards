import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import crypto from "crypto";

// Funktion för att skapa en kort (6 tecken, versaler + siffror)
function generateShortCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exkluderar I, 1, O, 0 för läsbarhet
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
    
    // Hämta metadata vi skickade med vid köpet (kommer i nästa steg)
    const quantity = parseInt(session.metadata?.quantity || "1");
    const material = session.metadata?.material || "plastic";
    const customerType = session.metadata?.customerType === "company" ? "COMPANY" : "PRIVATE";
    
    // 1. Skapa Ordern i DB
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

    console.log(`✅ Order ${order.id} created.`);

    // 2. Generera Card Slots (loopa antalet kort)
    const cardsToCreate = [];
    
    for (let i = 0; i < quantity; i++) {
      const cardCode = generateShortCode(); 
      // OBS: I produktion bör du kolla i DB så koden inte redan finns, 
      // men med 6 tecken och slump är krockrisken liten vid låga volymer.
      
      const claimToken = crypto.randomBytes(32).toString("hex");

      cardsToCreate.push({
        orderId: order.id,
        cardCode: cardCode,
        claimToken: claimToken,
        status: "UNCLAIMED" as const, // Måste casta enum om TS klagar
        material: material,
        // Designvalen kan också hämtas från metadata här om vi sparat dem
      });
    }

    // Batch insert för prestanda
    await prisma.card.createMany({
      data: cardsToCreate,
    });

    console.log(`✅ ${quantity} card slots generated for Order ${order.id}.`);
    
    // Här skulle du kunna trigga ett email via Resend som skickar bekräftelse
    // await sendOrderConfirmation(order.customerEmail, cardsToCreate);
  }

  return new NextResponse(null, { status: 200 });
}