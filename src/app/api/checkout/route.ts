import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { Stripe } from "stripe";
import { z } from "zod";

// 1. Definiera Zod-schema för strikt validering
const checkoutSchema = z.object({
  quantity: z.number().min(1).max(50).default(1), // Spärra orimliga kvantiteter
  material: z.enum(["pvc", "metal"]).optional(), // Tillåt bara giltiga material
  color: z.string().max(50).optional(),
  design: z.string().max(50).optional(),
  isSubscription: z.boolean().optional(),
  bundled: z.boolean().optional(),
}).refine((data) => data.isSubscription || data.material, {
  // 2. Logisk validering: Man måste köpa NÅGOT (antingen prenumeration eller kort)
  message: "Du måste välja antingen en prenumeration eller ett kortmaterial.",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 3. Validera indata
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      console.error("[CHECKOUT_VALIDATION_ERROR]", result.error);
      return new NextResponse("Invalid request data", { status: 400 });
    }

    const { 
      quantity, 
      material, 
      color, 
      design, 
      isSubscription, 
      bundled 
    } = result.data;

    // 4. Säkerställ URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL is missing");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "payment";

    // --- FALL 1: Endast Premium Prenumeration ---
    // (Om man inte köper kort samtidigt, dvs !bundled)
    if (isSubscription && !bundled) {
      mode = "subscription";
      line_items.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: "AvyraCards Premium",
            description: "Månadsprenumeration - Lås upp alla funktioner",
          },
          unit_amount: 9900, // 99 kr
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      });
    } 
    
    // --- FALL 2: Kortköp (Med eller utan Premium Bundling) ---
    else if (material) {
      const unitPrice = material === "metal" ? 49900 : 14900; 
      const productName = material === "metal" ? "AvyraCards Metal" : "AvyraCards Standard";

      // 1. Lägg till kortet
      line_items.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: productName,
            description: `${material.toUpperCase()} | ${(color || "DEFAULT").toUpperCase()} | ${(design || "DEFAULT").toUpperCase()}`,
          },
          unit_amount: unitPrice,
        },
        quantity: quantity,
      });

      // 2. Bundling (6 månader Premium engångsköp)
      if (bundled) {
        line_items.push({
          price_data: {
            currency: "sek",
            product_data: {
              name: "AvyraCards Premium (6 månader)",
              description: "Bundling-erbjudande (Spara 37%)",
            },
            unit_amount: 29900, // 299 kr
          },
          quantity: 1, // Alltid 1 paket per köp i dagsläget
        });
      }
      
      mode = "payment";
    }

    // Dubbelkoll så vi inte skickar en tom array till Stripe (ska fångas av Zod .refine, men som extra säkerhet)
    if (line_items.length === 0) {
      return new NextResponse("No items to checkout", { status: 400 });
    }

    // Skapa sessionen
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: mode,
      success_url: isSubscription && !bundled 
        ? `${baseUrl}/register/activate?session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`,
      
      cancel_url: isSubscription ? `${baseUrl}/get-started` : `${baseUrl}/order`,
      
      metadata: {
        type: isSubscription ? "premium_subscription" : "card_order",
        quantity: quantity.toString(),
        material: material || "",
        color: color || "",
        design: design || "",
        isBundled: bundled ? "true" : "false"
      },
      
      // Vi kräver adress ENDAST om det är en fysisk produkt
      shipping_address_collection: (material && !isSubscription) ? {
        allowed_countries: ["SE"], 
      } : undefined,
      
      phone_number_collection: {
        enabled: true,
      },
      
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
