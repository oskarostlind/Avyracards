import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quantity, material, color, design } = body; // Lade till 'design'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const unitPrice = material === "metal" ? 49900 : 14900; 
    const productName = material === "metal" ? "SocialCard Metal" : "SocialCard Standard";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: {
              name: productName,
              // Vi lägger in valen i beskrivningen så kunden ser vad de köper
              description: `${material.toUpperCase()} | ${color.toUpperCase()} | ${design.toUpperCase()}`,
            },
            unit_amount: unitPrice,
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/verify-sent?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/order`,
      
      // VIKTIGT: Vi skickar med allt i metadata för att Webhooken ska kunna läsa det
      metadata: {
        quantity: quantity.toString(),
        material: material,
        color: color,
        design: design,
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