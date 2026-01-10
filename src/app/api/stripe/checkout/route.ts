import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { z } from "zod";

// --- VALIDATION SCHEMAS ---

// Cart Item: Nu med stöd för 'customImage'
const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1).max(50).default(1),
  color: z.string().optional(),
  design: z.string().optional(),
  material: z.string().optional(),
  // Om användaren laddat upp en bild skickar vi en referens/flagga här
  customImage: z.string().nullable().optional(), 
});

// Checkout Payload: Nu med 'premiumOption'
const checkoutSchema = z.object({
  items: z.array(cartItemSchema).optional(),
  
  // Nya bundle-väljaren
  premiumOption: z.enum(["none", "1mo", "6mo"]).optional().default("none"),

  // Legacy support (kan behållas för bakåtkompatibilitet)
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

    // 1. Normalisera indata till en array
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

    // 2. Hämta priser från DB (Säkerhet: Lita aldrig på frontend-priser för huvudprodukten)
    const variantIds = itemsToProcess.map(i => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true },
        include: { product: true }
    });

    if (dbVariants.length !== itemsToProcess.length) {
        // Om en produkt saknas (t.ex. bundle-varianten är felaktig)
        // För enkelhetens skull, om bundle-varianten inte hittas kan vi behöva hantera det,
        // men här antar vi strikt matchning.
        // OBS: Om du skickar med ett "fejk-id" för bundlen måste det finnas i DB,
        // annars kraschar det här.
        console.warn("Mismatch between requested items and DB variants");
    }

    // 3. Bygg Stripe Line Items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let hasSubscription = false; // Flagga för att styra Stripe mode
    
    // A. Hantera Fysiska Kort & Custom Print
    for (const item of itemsToProcess) {
        const dbVariant = dbVariants.find(v => v.id === item.variantId);
        
        // Om varianten inte finns i DB, hoppa över (eller kasta fel)
        if (!dbVariant) continue;

        if (dbVariant.type === "SUBSCRIPTION") hasSubscription = true;

        // Lägg till kortet
        line_items.push({
            price_data: {
                currency: dbVariant.currency,
                product_data: {
                    name: dbVariant.product.name,
                    description: `${dbVariant.name} (${item.material || "Standard"})`,
                    metadata: {
                        color: item.color || "",
                        material: item.material || "",
                        design: item.design || ""
                    },
                    images: item.customImage ? [] : undefined // Kan lägga till bild-URL här om vi vill
                },
                unit_amount: dbVariant.price, // Pris i ören från DB
                recurring: dbVariant.type === "SUBSCRIPTION" ? { interval: "month" } : undefined,
            },
            quantity: item.quantity,
        });

        // Hantera Custom Print Fee (100 kr)
        // Vi lägger detta som en separat rad för tydlighet
        if (item.customImage) {
            line_items.push({
                price_data: {
                    currency: "sek",
                    product_data: {
                        name: "Custom Print",
                        description: "Egen logotyp/design på kortet",
                    },
                    unit_amount: 10000, // 100 kr i ören
                },
                quantity: item.quantity, // En avgift per kort
            });
        }
    }

    // B. Hantera Premium Bundle (Ad-hoc priser baserat på val)
    // Detta gör att vi slipper skapa specifika stripe-produkter för dessa just nu.
    const premiumOption = result.data.premiumOption;

if (premiumOption === "1mo") {
        line_items.push({
            price_data: {
                currency: "sek",
                product_data: {
                    name: "1 Månad Premium (Startpaket)",
                    description: "Ingår utan kostnad",
                },
                unit_amount: 0, // ÄNDRAT FRÅN 10000 TILL 0
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
                unit_amount: 29900, // 299 kr
            },
            quantity: 1,
        });
    }

    // 4. Konfigurera Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) return new NextResponse("Server Config Error", { status: 500 });

    let successUrl = `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`;
    
    // Om det är en ren prenumeration (inte bundle-engångsbetalning), skicka till billing
    // Notera: Våra bundle-premium-val ovan är just nu engångs ("payment") för enkelhetens skull.
    // Vill du att de ska starta en prenumeration direkt måste vi använda stripe price-IDs.
    if (hasSubscription && userId) {
        successUrl = `${baseUrl}/profile/settings?view=billing&success=true`;
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      // Om vi blandar engångsköp (kort) med återkommande (subscription) måste mode vara "subscription"
      // Men just nu kör vi Bundle-Premium som "Engångsperioder" (Pre-paid), så "payment" fungerar.
      mode: hasSubscription ? "subscription" : "payment", 
      success_url: successUrl,
      cancel_url: `${baseUrl}/order`,
      
      metadata: {
        userId: userId || "",
        type: "bundle_order",
        premiumOption: premiumOption, // Bra att spara vad de valde
        hasCustomPrint: itemsToProcess.some(i => i.customImage) ? "true" : "false"
      },
      
      shipping_address_collection: {
        allowed_countries: ["SE"], 
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