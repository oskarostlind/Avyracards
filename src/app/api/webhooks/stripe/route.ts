import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import crypto from "crypto";

// Hjälpfunktion för att skapa kortkoder
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
    console.error(`Webhook signature verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // --- HANTERA CHECKOUT SESSION COMPLETED ---
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const type = session.metadata?.type;
    const userId = session.metadata?.userId; 

    // ==========================================
    // SCENARIO 1: Endast Premium-prenumeration
    // ==========================================
    if (type === "premium_subscription") {
      
      // FIX: Hantera gästköp (userId saknas eller är tom sträng)
      if (!userId || userId.trim() === "") {
        console.log(`📝 Guest Premium purchase detected for session ${session.id}. Waiting for manual activation via /register.`);
        // Vi returnerar 200 OK för att Stripe ska vara nöjda.
        // Aktiveringen sker senare via /api/stripe/verify-session när användaren skapat konto.
        return new NextResponse(null, { status: 200 });
      }

      console.log(`✨ Activating Premium for User: ${userId}`);

      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            stripeCustomerId: session.customer as string,
          },
        });
        console.log("✅ User updated to Premium successfully.");
      } catch (err) {
        console.error("Failed to update user premium status:", err);
        // Returnera 200 även vid fel för att undvika loopar hos Stripe, logga felet noga.
      }

      return new NextResponse(null, { status: 200 });
    }

    // ==========================================
    // SCENARIO 2: Fysisk Kortbeställning
    // ==========================================
    
    // 1. Idempotency Check
    const existingOrder = await prisma.order.findUnique({
      where: {
        stripeSessionId: session.id,
      },
    });

    if (existingOrder) {
      console.log(`⚠️ Order already processed for session ${session.id}. Skipping.`);
      return new NextResponse(null, { status: 200 });
    }

    const quantity = parseInt(session.metadata?.quantity || "1");
    const material = session.metadata?.material || "plastic";
    const color = session.metadata?.color || "black";
    const design = session.metadata?.design || "minimal";
    const customerType = session.metadata?.customerType === "company" ? "COMPANY" : "PRIVATE";

    // 2. Skapa Order
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

    // 3. Generera Card Slots
    const cardsToCreate = [];
    for (let i = 0; i < quantity; i++) {
      cardsToCreate.push({
        orderId: order.id,
        cardCode: generateShortCode(),
        claimToken: crypto.randomBytes(32).toString("hex"),
        status: "UNCLAIMED" as const,
        material: material,
        colorOption: color,
        designTemplate: design,
      });
    }

    await prisma.card.createMany({
      data: cardsToCreate,
    });

    console.log(`✅ ${quantity} physical cards created for Order ${order.id}`);

    // ==========================================
    // SCENARIO 3: Bundle (Fysiskt kort + Premium)
    // ==========================================
    if (session.metadata?.isBundled === "true" && userId) {
      console.log(`🎁 Bundle detected! Activating Premium for User: ${userId}`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: true,
          stripeCustomerId: session.customer as string,
        },
      });
    }
  }

  // --- HANTERA AVSLUTAD PRENUMERATION ---
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = subscription.customer as string;

    console.log(`🚫 Subscription deleted for customer: ${stripeCustomerId}`);

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: false },
      });
      console.log(`✅ Premium revoked for user ${user.id}`);
    } else {
      console.warn("Could not find user to revoke premium for.");
    }
  }

  return new NextResponse(null, { status: 200 });
}