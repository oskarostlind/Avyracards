import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { z } from "zod";

const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1).max(50).default(1),
  color: z.string().optional(),
  design: z.string().optional(),
  material: z.string().optional(),
  customPrintUrl: z.string().nullable().optional(),
});

const paymentIntentSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  premiumOption: z.enum(["none", "1mo", "6mo"]).optional().default("none"),
});

const CUSTOM_PRINT_SURCHARGE_ORE = 10000;

export async function POST(req: Request) {
  try {
    const sessionAuth = await auth();
    const userId = sessionAuth?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = paymentIntentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    const { items, premiumOption } = parsed.data;

    if (premiumOption === "6mo") {
      return NextResponse.json(
        {
          error:
            "6-månaders premium köps via App Store i iOS-appen. Fortsätt med kortköpet eller välj 1 mån gratis.",
        },
        { status: 400 }
      );
    }

    const variantIds = items.map((item) => item.variantId);
    const dbVariants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, isActive: true },
      include: { product: true },
    });

    let amountTotal = 0;
    const normalizedItems = [];

    for (const item of items) {
      const dbVariant = dbVariants.find((variant) => variant.id === item.variantId);
      if (!dbVariant) {
        return NextResponse.json({ error: "Produkt hittades inte" }, { status: 400 });
      }

      const customPrintCost =
        item.material === "metal" && item.customPrintUrl ? CUSTOM_PRINT_SURCHARGE_ORE : 0;
      const unitAmount = dbVariant.price + customPrintCost;
      const lineTotal = unitAmount * item.quantity;
      amountTotal += lineTotal;

      normalizedItems.push({
        ...item,
        price: unitAmount,
        productName: dbVariant.product.name,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountTotal,
      currency: "sek",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId,
        type: "ios_card_order",
        premiumOption,
        checkoutSource: "ios",
        items: JSON.stringify(normalizedItems),
      },
      receipt_email: user?.email,
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Failed to create payment intent" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountTotal,
      currency: "sek",
      summaryItems: normalizedItems.map((item) => ({
        label: item.productName,
        amount: item.price * item.quantity,
      })),
    });
  } catch (error) {
    console.error("[PAYMENT_INTENT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
