import { auth } from "@/auth";
import { prisma } from "@/lib/prisma"; // Vi behöver prisma här nu
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type { Stripe } from "stripe";
import { z } from "zod";

// Nytt schema: Vi bryr oss mest om variantId nu
const checkoutSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1).max(50).default(1),
  // Vi sparar dessa för fysiska kort, men de är optional för premium
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

    const { variantId, quantity, color, design, material } = result.data;

    // 1. HÄMTA VARIANTEN FRÅN DATABASEN
    // Detta är säkerhetsspärren. Vi litar inte på priset från frontend via JSON.
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true }
    });

    if (!variant || !variant.isActive) {
      return new NextResponse("Produkt ej tillgänglig", { status: 404 });
    }

    // 2. KONFIGURERA URL:ER
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) return new NextResponse("Server Config Error", { status: 500 });

    let successUrl = `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`;
    
    // Om det är en prenumeration (Premium)
    if (variant.type === "SUBSCRIPTION") {
        successUrl = userId 
            ? `${baseUrl}/profile/settings?view=billing&success=true`
            : `${baseUrl}/register/activate?session_id={CHECKOUT_SESSION_ID}`;
    }

    // 3. SKAPA LINE ITEM BASERAT PÅ DB-DATA
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [{
      price_data: {
        currency: variant.currency,
        product_data: {
          name: variant.product.name, // T.ex. "AvyraCards Premium"
          description: variant.name,  // T.ex. "Månadsprenumeration"
        },
        unit_amount: variant.price, // HÄMTAS FRÅN DB (t.ex. 9900)
        recurring: variant.type === "SUBSCRIPTION" ? { interval: "month" } : undefined,
      },
      quantity: quantity,
    }];

    // 4. SKAPA SESSIONEN
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: variant.type === "SUBSCRIPTION" ? "subscription" : "payment",
      success_url: successUrl,
      cancel_url: `${baseUrl}/get-started`, // Eller var man kom ifrån
      
      metadata: {
        userId: userId || "",
        type: variant.type === "SUBSCRIPTION" ? "premium_subscription" : "card_order",
        // Vi skickar med extra data för fysiska kort om det behövs senare
        material: material || "",
        color: color || "",
        design: design || "",
        variantId: variant.id // Bra för debugging
      },
      
      // Kräv adress endast för fysiska varor
      shipping_address_collection: (variant.type === "PHYSICAL") ? {
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