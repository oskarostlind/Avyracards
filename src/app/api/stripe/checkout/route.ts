import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { z } from "zod";

// --- VALIDATION SCHEMAS ---
const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1).max(50).default(1),
  color: z.string().optional(),
  design: z.string().optional(),
  material: z.string().optional(),
  customImage: z.string().nullable().optional(), 
});

const checkoutSchema = z.object({
  items: z.array(cartItemSchema).optional(),
  premiumOption: z.enum(["none", "1mo", "6mo"]).optional().default("none"),
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

    if (!userId) {
        return new NextResponse("Unauthorized: You must be logged in to checkout", { status: 401 });
    }

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // 1. Normalisera indata
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
            customImage: null,
        });
    } else {
        return new NextResponse("No items provided", { status: 400 });
    }

    // 2. Hämta priser från DB
    const variantIds = itemsToProcess.map(i => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
        include: { product: true }
    });

    // 3. Bygg Stripe Line Items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let hasSubscription = false; 
    
    // A. Hantera Fysiska Kort & Custom Print
    for (const item of itemsToProcess) {
        const dbVariant = dbVariants.find(v => v.id === item.variantId);
        if (!dbVariant) continue;

        if (dbVariant.type === "SUBSCRIPTION") hasSubscription = true;

        line_items.push({
            price_data: {
                currency: dbVariant.currency,
                product_data: {
                    name: dbVariant.product.name,
                    description: `${dbVariant.name} (${item.material || "Standard"})`,
                    metadata: {
                        // VIKTIGT: Vi sparar variantId här så webhooken kan skapa OrderItem
                        variantId: dbVariant.id, 
                        color: item.color || "",
                        material: item.material || "",
                        design: item.design || ""
                    },
                    images: item.customImage ? [] : undefined 
                },
                unit_amount: dbVariant.price,
                recurring: dbVariant.type === "SUBSCRIPTION" ? { interval: "month" } : undefined,
            },
            quantity: item.quantity,
        });

        if (item.customImage) {
            line_items.push({
                price_data: {
                    currency: "sek",
                    product_data: {
                        name: "Custom Print",
                        description: "Egen logotyp/design på kortet",
                    },
                    unit_amount: 10000, 
                },
                quantity: item.quantity, 
            });
        }
    }

    // B. Hantera Premium Bundle
    const premiumOption = result.data.premiumOption;

    if (premiumOption === "1mo") {
        line_items.push({
            price_data: {
                currency: "sek",
                product_data: {
                    name: "1 Månad Premium (Startpaket)",
                    description: "Ingår utan kostnad",
                },
                unit_amount: 0, 
            },
            quantity: 1,
        });
    } else if (premiumOption === "6mo") {
        line_items.push({
            price_data: {
                currency: "sek",
                product_data: {
                    name: "Avyra Premium (6 mån)",
                    description: "Pro Bundle Upgrade",
                },
                unit_amount: 29900, 
            },
            quantity: 1,
        });
    }

    // 4. Konfigurera Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) return new NextResponse("Server Config Error", { status: 500 });

    let successUrl = `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`;
    
    if ((premiumOption !== "none" || hasSubscription) && userId) {
        successUrl = `${baseUrl}/profile/settings?view=billing&success=true`;
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: hasSubscription ? "subscription" : "payment", 
      success_url: successUrl,
      cancel_url: `${baseUrl}/order`,
      
      metadata: {
        userId: userId, 
        type: "bundle_order",
        premiumOption: premiumOption,
        hasCustomPrint: itemsToProcess.some(i => i.customImage) ? "true" : "false"
      },
      
      shipping_address_collection: {
        allowed_countries: ["SE", "NO", "DK", "FI", "DE", "US", "GB"], // La till fler för säkerhets skull
      },
      
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