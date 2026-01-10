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

        // Hämta detaljerade rader för att komma åt metadata på produkterna
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
        });

        const shipping = (session as any).shipping_details?.address;
        const shippingName = (session as any).shipping_details?.name;
        
        // Förbered OrderItems (länk mellan Order och ProductVariant)
        const orderItemsToCreate = [];
        
        for (const item of lineItems.data) {
             // @ts-ignore - Stripe types kan vara lite bråkiga med expand
             const productMetadata = item.price?.product?.metadata || {};
             // Hämta variantId som vi sparade i checkout-routen
             const variantId = productMetadata.variantId; 

             // Om det är en produktvariant vi känner igen (inte Custom Print eller 0kr Premium)
             if (variantId) {
                 orderItemsToCreate.push({
                     productVariantId: variantId,
                     quantity: item.quantity || 1,
                     price: item.amount_total // Sparar vad de faktiskt betalade
                 });
             }
        }

        // Skapa ordern med koppling till USER och ITEMS
        const order = await prisma.order.create({
            data: {
                stripeSessionId: session.id,
                amountTotal: session.amount_total || 0,
                currency: session.currency || "sek",
                status: "PAID",
                customerEmail: session.customer_details?.email || "",
                customerType: "PRIVATE",
                
                // LÄNKA TILL ANVÄNDAREN (FIXEN)
                userId: userId || null, 

                // LÄNKA TILL VARIANTERNA (FIXEN)
                items: {
                    create: orderItemsToCreate
                },
                
                // Leveransinfo
                shippingName: shippingName || session.customer_details?.name,
                shippingLine1: shipping?.line1,
                shippingLine2: shipping?.line2,
                shippingCity: shipping?.city,
                shippingPostalCode: shipping?.postal_code,
                shippingCountry: shipping?.country,
                
                quantity: lineItems.data.length,
            },
        });

        // Skapa korten (Cards) - Samma logik som förut
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

            // Om det har ett variantId (är ett kort)
            // @ts-ignore
            if (item.price?.product?.metadata?.variantId) {
                const qty = item.quantity || 1;
                for (let i = 0; i < qty; i++) {
                     let detectedMaterial = "plastic";
                     if (description.toLowerCase().includes("metal")) detectedMaterial = "metal";
                     
                     let detectedColor = "black"; 

                     cardsToCreate.push({
                        orderId: order.id,
                        cardCode: generateShortCode(),
                        claimToken: crypto.randomBytes(32).toString("hex"),
                        status: "UNCLAIMED" as const,
                        material: detectedMaterial,
                        colorOption: detectedColor,
                        designTemplate: "minimal",
                        // Tilldela kortet direkt till användaren om vi vet vem det är
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

        // Aktivera Premium om tillämpligt
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