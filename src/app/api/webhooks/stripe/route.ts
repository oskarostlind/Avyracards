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
    console.error(`Webhook verification failed: ${error.message}`);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const type = session.metadata?.type;
    const userId = session.metadata?.userId; 
    const premiumOption = session.metadata?.premiumOption;

    console.log(`[Webhook] Processing session ${session.id}. Metadata UserId: ${userId}`);

    // SCENARIO 1: Premium Subscription
    if (type === "premium_subscription") {
       if (!userId) return new NextResponse(null, { status: 200 });
       
       await prisma.user.update({
         where: { id: userId },
         data: { isPremium: true, stripeCustomerId: session.customer as string },
       });
       return new NextResponse(null, { status: 200 });
    }

    // SCENARIO 2 & 3: Order & Bundle
    if (type === "card_order" || type === "bundle_order") {
        
        const existingOrder = await prisma.order.findUnique({
            where: { stripeSessionId: session.id },
        });

        if (existingOrder) {
            return new NextResponse(null, { status: 200 });
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
        });

        // FIX: Stripe kan ibland lägga adressen under customer_details om shipping_details saknas
        const shipping = (session as any).shipping_details?.address || session.customer_details?.address;
        const shippingName = (session as any).shipping_details?.name || session.customer_details?.name;
        
        const orderItemsToCreate = [];
        
        for (const item of lineItems.data) {
             // @ts-ignore
             const productMetadata = item.price?.product?.metadata || {};
             const variantId = productMetadata.variantId; 

             if (variantId) {
                 orderItemsToCreate.push({
                     productVariantId: variantId,
                     quantity: item.quantity || 1,
                     price: item.amount_total 
                 });
             }
        }

        const order = await prisma.order.create({
            data: {
                stripeSessionId: session.id,
                amountTotal: session.amount_total || 0,
                currency: session.currency || "sek",
                status: "PAID",
                customerEmail: session.customer_details?.email || "",
                customerType: "PRIVATE",
                
                userId: userId || null, 

                items: {
                    create: orderItemsToCreate
                },
                
                // Leveransinfo
                shippingName: shippingName,
                shippingLine1: shipping?.line1,
                shippingLine2: shipping?.line2,
                shippingCity: shipping?.city,
                shippingPostalCode: shipping?.postal_code,
                shippingCountry: shipping?.country,
                
                quantity: lineItems.data.length,
            },
        });

        const cardsToCreate = [];
        let hasPremiumProduct = false;

        for (const item of lineItems.data) {
            const description = item.description || "";
            const isPremiumItem = description.toLowerCase().includes("premium");
            const isCustomPrint = description.toLowerCase().includes("custom print");

            if (isPremiumItem) {
                hasPremiumProduct = true;
                continue;
            }
            if (isCustomPrint) continue;

            // @ts-ignore
            const productMetadata = item.price?.product?.metadata || {};

            if (productMetadata.variantId) {
                const qty = item.quantity || 1;
                for (let i = 0; i < qty; i++) {
                     const detectedMaterial = productMetadata.material || "plastic";
                     const detectedColor = productMetadata.color || "black";
                     const detectedDesign = productMetadata.design || "minimal";
                     const printFileUrl = productMetadata.printFileUrl || null;

                     cardsToCreate.push({
                        orderId: order.id,
                        cardCode: generateShortCode(),
                        claimToken: crypto.randomBytes(32).toString("hex"),
                        status: "UNCLAIMED" as const,
                        material: detectedMaterial,
                        colorOption: detectedColor,
                        designTemplate: detectedDesign,
                        printFileUrl: printFileUrl, 
                        assignedUserId: userId || null 
                    });
                }
            }
        }

        if (cardsToCreate.length > 0) {
            await prisma.card.createMany({
                data: cardsToCreate,
            });
        }

        if (userId && (premiumOption === "1mo" || premiumOption === "6mo" || hasPremiumProduct)) {
            console.log(`[Webhook] Activating Premium for User ${userId}.`);
            
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isPremium: true,
                    stripeCustomerId: session.customer as string,
                },
            });
        }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: false },
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}