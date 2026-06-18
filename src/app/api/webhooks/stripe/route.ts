import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { fulfillPhysicalCardOrder, type PhysicalOrderItemInput } from "@/lib/stripe-order-fulfillment";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook verification failed: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const type = session.metadata?.type;
    const userId = session.metadata?.userId; 
    const premiumOption = session.metadata?.premiumOption;

    console.log(`[Webhook] Processing session ${session.id}. Metadata UserId: ${userId}`);

    // SCENARIO 1: Premium Subscription
    if (type === "premium_subscription") {
       if (!userId) return new NextResponse(null, { status: 200 });
       
       await prisma.user.update({
         where: { id: userId },
         data: { isPremium: true, stripeCustomerId: session.customer as string },
       });
       return new NextResponse(null, { status: 200 });
    }

    // SCENARIO 2 & 3: Order & Bundle
    if (type === "card_order" || type === "bundle_order") {
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product'],
        });

        const shipping = (session as Stripe.Checkout.Session & {
          shipping_details?: { address?: Stripe.Address; name?: string };
        }).shipping_details?.address || session.customer_details?.address;
        const shippingName = (session as Stripe.Checkout.Session & {
          shipping_details?: { address?: Stripe.Address; name?: string };
        }).shipping_details?.name || session.customer_details?.name;
        
        const orderItemsToCreate: PhysicalOrderItemInput[] = [];
        
        for (const item of lineItems.data) {
             const product = item.price?.product;
             const productMetadata =
               typeof product === "object" && product && "metadata" in product
                 ? product.metadata
                 : {};
             const variantId = productMetadata.variantId; 

             if (variantId) {
                 orderItemsToCreate.push({
                     variantId,
                     quantity: item.quantity || 1,
                     price: item.amount_total ?? 0,
                     material: productMetadata.material,
                     color: productMetadata.color,
                     design: productMetadata.design,
                     customPrintUrl: productMetadata.printFileUrl ?? null,
                 });
             }
        }

        await fulfillPhysicalCardOrder({
          userId: userId || null,
          amountTotal: session.amount_total || 0,
          currency: session.currency || "sek",
          customerEmail: session.customer_details?.email || "",
          checkoutSource: "web",
          stripeSessionId: session.id,
          premiumOption:
            premiumOption === "1mo" || premiumOption === "6mo"
              ? premiumOption
              : "none",
          items: orderItemsToCreate,
          shipping: {
            name: shippingName,
            line1: shipping?.line1,
            line2: shipping?.line2,
            city: shipping?.city,
            postalCode: shipping?.postal_code,
            country: shipping?.country,
          },
        });
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    if (paymentIntent.metadata?.type === "ios_card_order") {
      const userId = paymentIntent.metadata.userId || null;
      const premiumOption = paymentIntent.metadata.premiumOption as
        | "none"
        | "1mo"
        | "6mo"
        | undefined;

      let parsedItems: PhysicalOrderItemInput[] = [];
      try {
        parsedItems = JSON.parse(paymentIntent.metadata.items || "[]") as PhysicalOrderItemInput[];
      } catch {
        parsedItems = [];
      }

      const shipping = paymentIntent.shipping;
      const latestCharge = paymentIntent.latest_charge;
      let customerEmail = paymentIntent.receipt_email ?? "";

      if (!customerEmail && typeof latestCharge === "string") {
        const charge = await stripe.charges.retrieve(latestCharge);
        customerEmail = charge.billing_details.email ?? "";
      }

      await fulfillPhysicalCardOrder({
        userId,
        amountTotal: paymentIntent.amount_received,
        currency: paymentIntent.currency,
        customerEmail,
        checkoutSource: "ios",
        stripePaymentIntentId: paymentIntent.id,
        premiumOption: premiumOption ?? "none",
        items: parsedItems,
        shipping: {
          name: shipping?.name,
          line1: shipping?.address?.line1,
          line2: shipping?.address?.line2,
          city: shipping?.address?.city,
          postalCode: shipping?.address?.postal_code,
          country: shipping?.address?.country,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = subscription.customer as string;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId },
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isPremium: false },
      });
    }
  }

  return new NextResponse(null, { status: 200 });
}