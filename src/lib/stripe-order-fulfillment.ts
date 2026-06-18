import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function generateShortCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface PhysicalOrderItemInput {
  variantId: string;
  quantity: number;
  price: number;
  material?: string;
  color?: string;
  design?: string;
  customPrintUrl?: string | null;
}

export interface PhysicalOrderFulfillmentInput {
  userId: string | null;
  amountTotal: number;
  currency: string;
  customerEmail: string;
  checkoutSource: "web" | "ios";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  premiumOption?: "none" | "1mo" | "6mo";
  items: PhysicalOrderItemInput[];
  shipping?: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
  };
}

export async function fulfillPhysicalCardOrder(
  input: PhysicalOrderFulfillmentInput
): Promise<string> {
  if (input.stripeSessionId) {
    const existing = await prisma.order.findUnique({
      where: { stripeSessionId: input.stripeSessionId },
    });
    if (existing) {
      return existing.id;
    }
  }

  if (input.stripePaymentIntentId) {
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: input.stripePaymentIntentId },
    });
    if (existing) {
      return existing.id;
    }
  }

  const order = await prisma.order.create({
    data: {
      stripeSessionId: input.stripeSessionId ?? null,
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
      checkoutSource: input.checkoutSource,
      amountTotal: input.amountTotal,
      currency: input.currency,
      status: "PAID",
      customerEmail: input.customerEmail,
      customerType: "PRIVATE",
      userId: input.userId,
      quantity: input.items.reduce((sum, item) => sum + item.quantity, 0),
      shippingName: input.shipping?.name ?? null,
      shippingLine1: input.shipping?.line1 ?? null,
      shippingLine2: input.shipping?.line2 ?? null,
      shippingCity: input.shipping?.city ?? null,
      shippingPostalCode: input.shipping?.postalCode ?? null,
      shippingCountry: input.shipping?.country ?? null,
      items: {
        create: input.items.map((item) => ({
          productVariantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
  });

  const cardsToCreate = [];

  for (const item of input.items) {
    for (let i = 0; i < item.quantity; i++) {
      cardsToCreate.push({
        orderId: order.id,
        cardCode: generateShortCode(),
        claimToken: crypto.randomBytes(32).toString("hex"),
        status: "UNCLAIMED" as const,
        material: item.material ?? "plastic",
        colorOption: item.color ?? "black",
        designTemplate: item.design ?? "minimal",
        printFileUrl: item.customPrintUrl ?? null,
        assignedUserId: input.userId,
      });
    }
  }

  if (cardsToCreate.length > 0) {
    await prisma.card.createMany({ data: cardsToCreate });
  }

  if (
    input.userId &&
    (input.premiumOption === "1mo" || input.premiumOption === "6mo")
  ) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { isPremium: true },
    });
  }

  return order.id;
}
