import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { Stripe } from "stripe";

// Definiera interface för inkommande data
interface CheckoutBody {
  quantity?: number;
  material?: string;
  color?: string;
  design?: string;
  isSubscription?: boolean;
  bundled?: boolean;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutBody;
    
    const { 
      quantity, 
      material, 
      color, 
      design, 
      isSubscription, 
      bundled 
    } = body;

    // 1. Säkerställ URL. Kastar fel om den saknas i prod för att undvika localhost-redirects av misstag.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL is missing");
      return new NextResponse("Server Configuration Error", { status: 500 });
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let mode: Stripe.Checkout.SessionCreateParams.Mode = "payment";

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
            description: `${(material || "").toUpperCase()} | ${(color || "").toUpperCase()} | ${(design || "").toUpperCase()}`,
          },
          unit_amount: unitPrice,
        },
        quantity: quantity || 1,
      });

      // 2. Bundling (6 månader Premium engångsköp)
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
      
      mode = "payment";
    }

    // Skapa sessionen
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: mode,
      // Vi använder baseUrl som nu garanterat är satt eller error
      success_url: isSubscription && !bundled 
        ? `${baseUrl}/register/activate?session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`,
      
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