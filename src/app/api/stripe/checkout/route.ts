import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { z } from "zod";

// Vi definierar en "Cart Item"-struktur
const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1).max(50).default(1),
  // Metadata för produkten
  color: z.string().optional(),
  design: z.string().optional(),
  material: z.string().optional(),
});

// Uppdaterat schema: Kan ta emot antingen "items" (array) eller enskild "variantId" (legacy/enkel)
const checkoutSchema = z.object({
  // ALTERNATIV 1: Multi-product (Bundle)
  items: z.array(cartItemSchema).optional(),
  
  // ALTERNATIV 2: Single-product (Bakåtkompatibilitet)
  variantId: z.string().optional(),
  quantity: z.number().optional(),
  color: z.string().optional(),
  design: z.string().optional(),
  material: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth();
    const userId = sessionAuth?.user?.id;

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // Normalisera indata till en array av items
    let itemsToProcess: z.infer<typeof cartItemSchema>[] = [];

    if (result.data.items && result.data.items.length > 0) {
        itemsToProcess = result.data.items;
    } else if (result.data.variantId) {
        itemsToProcess.push({
            variantId: result.data.variantId,
            quantity: result.data.quantity || 1,
            color: result.data.color,
            design: result.data.design,
            material: result.data.material,
        });
    } else {
        return new NextResponse("No items provided", { status: 400 });
    }

    // Hämta alla varianter från databasen för att verifiera pris
    const variantIds = itemsToProcess.map(i => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
        include: { product: true }
    });

    if (dbVariants.length !== itemsToProcess.length) {
        return new NextResponse("En eller flera produkter är ej tillgängliga", { status: 404 });
    }

    // Bygg Stripe Line Items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let hasSubscription = false;
    let hasPhysical = false;

    for (const item of itemsToProcess) {
        const dbVariant = dbVariants.find(v => v.id === item.variantId);
        if (!dbVariant) continue;

        if (dbVariant.type === "SUBSCRIPTION") hasSubscription = true;
        if (dbVariant.type === "PHYSICAL") hasPhysical = true;

        line_items.push({
            price_data: {
                currency: dbVariant.currency,
                product_data: {
                    name: dbVariant.product.name,
                    description: dbVariant.name + (item.color ? ` - ${item.color}` : ""),
                    metadata: {
                        color: item.color || "",
                        material: item.material || ""
                    }
                },
                unit_amount: dbVariant.price,
                recurring: dbVariant.type === "SUBSCRIPTION" ? { interval: "month" } : undefined,
            },
            quantity: item.quantity,
        });
    }

    // URL Logic
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) return new NextResponse("Server Config Error", { status: 500 });

    let successUrl = `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`;
    
    // Om prenumeration är inblandad, skicka till billing
    if (hasSubscription && userId) {
        successUrl = `${baseUrl}/profile/settings?view=billing&success=true`;
    }

    // Skapa Sessionen
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: hasSubscription ? "subscription" : "payment", // Om mixed cart, använd subscription mode (oftast)
      success_url: successUrl,
      cancel_url: `${baseUrl}/order`, // Skicka tillbaka till order-sidan vid avbrott
      
      metadata: {
        userId: userId || "",
        type: hasSubscription ? "mixed_order" : "card_order",
        // Vi sparar en sammanfattning i metadata för enkelhetens skull
        itemsSummary: JSON.stringify(itemsToProcess.map(i => `${i.variantId}:${i.quantity}`))
      },
      
      // Adressinsamling
      shipping_address_collection: hasPhysical ? {
        allowed_countries: ["SE"], 
      } : undefined,
      
      phone_number_collection: { enabled: true },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      return new NextResponse("Failed to create session", { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}