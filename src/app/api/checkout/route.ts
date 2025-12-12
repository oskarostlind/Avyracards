import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quantity, material, color } = body;

    // SÄKERHET: Om env-variabeln saknas, använd localhost som fallback
    // Detta löser "Invalid URL" felet hos Stripe om .env inte laddats korrekt
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Prislogik (öre)
    const unitPrice = material === "metal" ? 49900 : 14900; 
    const productName = material === "metal" ? "SocialCard Metal" : "SocialCard Standard";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: productName,
              description: `${quantity}x ${material} kort (${color})`,
            },
            unit_amount: unitPrice,
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      
      // Här använder vi baseUrl för att garantera en giltig URL (ex: http://localhost:3000/verify-sent)
      success_url: `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/order`,
      
      metadata: {
        quantity: quantity.toString(),
        material: material,
        color: color,
        customerType: "private",
      },
      
      shipping_address_collection: {
        allowed_countries: ["SE"], 
      },
      phone_number_collection: {
        enabled: true,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}