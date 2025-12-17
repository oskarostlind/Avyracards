import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth"; // <-- NYTT: Viktig import
import type { Stripe } from "stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  quantity: z.number().min(1).max(50).default(1),
  material: z.enum(["pvc", "metal"]).optional(),
  color: z.string().max(50).optional(),
  design: z.string().max(50).optional(),
  isSubscription: z.boolean().optional(),
  bundled: z.boolean().optional(),
}).refine((data) => data.isSubscription || data.material, {
  message: "Du måste välja antingen en prenumeration eller ett kortmaterial.",
});

export async function POST(req: Request) {
  try {
    // 1. HÄMTA INLOGGAD ANVÄNDARE (Detta saknades!)
    const sessionAuth = await auth();
    const userId = sessionAuth?.user?.id;
    
    console.log("DEBUG CHECKOUT - UserID:", userId); // Kommer synas i Vercel logs

    const body = await req.json();
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
            name: "AvyraCards Premium",
            description: "Månadsprenumeration - Lås upp alla funktioner",
          },
          unit_amount: 9900,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      });
    } 
    
    // --- FALL 2: Kortköp ---
    else if (material) {
      const unitPrice = material === "metal" ? 49900 : 14900; 
      const productName = material === "metal" ? "AvyraCards Metal" : "AvyraCards Standard";

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

      if (bundled) {
        line_items.push({
          price_data: {
            currency: "sek",
            product_data: {
              name: "AvyraCards Premium (6 månader)",
              description: "Bundling-erbjudande (Spara 37%)",
            },
            unit_amount: 29900,
          },
          quantity: 1,
        });
      }
      
      mode = "payment";
    }

    if (line_items.length === 0) {
      return new NextResponse("No items to checkout", { status: 400 });
    }

    // Bestäm vart användaren ska skickas efter köp
    let successUrl = `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`;
    
    // Om det är en ren prenumeration
    if (isSubscription && !bundled) {
        if (userId) {
            // Om användaren redan finns (uppgradering), skicka till settings
            successUrl = `${baseUrl}/profile/settings?view=billing&success=true`;
        } else {
            // Om ny användare, skicka till registrering
            successUrl = `${baseUrl}/register/activate?session_id={CHECKOUT_SESSION_ID}`;
        }
    }

    // Skapa sessionen
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: mode,
      success_url: successUrl,
      cancel_url: isSubscription ? `${baseUrl}/get-started` : `${baseUrl}/order`,
      
      metadata: {
        userId: userId || "", // <-- HÄR ÄR FIXEN: Vi skickar med ID:t!
        type: isSubscription ? "premium_subscription" : "card_order",
        quantity: quantity.toString(),
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