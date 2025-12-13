import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Vi hanterar två fall: 
    // 1. Vanligt köp av kort (quantity, material etc finns)
    // 2. Premium prenumeration (isSubscription = true)
    
    const { 
      quantity, 
      material, 
      color, 
      design, 
      isSubscription, // Ny flagga
      bundled // Ny flagga om man köper BÅDE kort och premium
    } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const line_items: any[] = [];
    let mode: "payment" | "subscription" = "payment";

    // --- FALL 1: Endast Premium Prenumeration ---
    if (isSubscription && !bundled) {
      mode = "subscription";
      line_items.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: "SocialCard Premium",
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
      const productName = material === "metal" ? "SocialCard Metal" : "SocialCard Standard";

      // 1. Lägg till kortet
      line_items.push({
        price_data: {
          currency: "sek",
          product_data: {
            name: productName,
            description: `${material.toUpperCase()} | ${color.toUpperCase()} | ${design.toUpperCase()}`,
          },
          unit_amount: unitPrice,
        },
        quantity: quantity || 1,
      });

      // 2. Om Bundling är vald -> Lägg till Premium (6 månader förbetalt engångsköp eller subscription)
      // För enkelhetens skull i detta skede gör vi bundlingen som ett engångsköp av "6 månader Premium"
      // eftersom att blanda subscription och one-time payment i samma checkout kräver mer komplex Stripe-setup.
      if (bundled) {
        line_items.push({
          price_data: {
            currency: "sek",
            product_data: {
              name: "SocialCard Premium (6 månader)",
              description: "Bundling-erbjudande (Spara 37%)",
            },
            unit_amount: 29900, // 299 kr
          },
          quantity: 1,
        });
      }
      
      mode = "payment"; // Vi kör payment även vid bundling för enkelhet (6 mån förbetalt)
    }

    // Skapa sessionen
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: mode,
      success_url: isSubscription && !bundled 
        ? `${baseUrl}/register/activate?session_id={CHECKOUT_SESSION_ID}` // Om bara premium -> Gå till aktivering
        : `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`,     // Om kortköp -> Gå till tack-sida för leverans
      
      cancel_url: isSubscription ? `${baseUrl}/get-started` : `${baseUrl}/order`,
      
      metadata: {
        type: isSubscription ? "premium_subscription" : "card_order",
        quantity: quantity?.toString() || "1",
        material: material || "",
        color: color || "",
        design: design || "",
        isBundled: bundled ? "true" : "false"
      },
      
      shipping_address_collection: (material && !isSubscription) ? {
        allowed_countries: ["SE"], 
      } : undefined, // Ingen frakt om det bara är digital prenumeration
      
      phone_number_collection: {
        enabled: true,
      },
      
      // Tillåt promotion codes om du vill ha rabatter
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}