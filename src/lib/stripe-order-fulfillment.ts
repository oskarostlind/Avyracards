import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendSystemNotification } from "@/lib/notifications";

// Kortkoden trycks på kortet och används som uppslagsnyckel i /c/<code>.
// Math.random() är förutsägbar — använd CSPRNG så att koder i samma batch
// inte går att härleda ur varandra.
function generateShortCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(crypto.randomInt(0, chars.length));
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
  // "admin_gift" = order skapad manuellt från admin (gratis kort till t.ex.
  // influencers). Går genom exakt samma kod som Stripe-webhooken.
  checkoutSource: "web" | "ios" | "admin_gift";
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

  let premiumWasActivated = false;
  let recipientName: string | null = input.shipping?.name ?? null;

  if (
    input.userId &&
    (input.premiumOption === "1mo" || input.premiumOption === "6mo")
  ) {
    // Läs före skrivningen: bara en faktisk övergång av → på ska ge ett
    // "Premium är aktiverat"-mail. Annars mailar vi den som redan har premium
    // varje gång de beställer ett kort till.
    const before = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { isPremium: true, name: true },
    });

    await prisma.user.update({
      where: { id: input.userId },
      data: { isPremium: true },
    });

    premiumWasActivated = before?.isPremium === false;
    recipientName = before?.name ?? recipientName;
  }

  // Produktförhandsvisning i bekräftelsemailet: namn + bild per beställd
  // variant. En enda findMany, inte en fråga per rad. Misslyckas den skickas
  // mailet ändå — bilderna är en trevlighet, inte orderns innehåll.
  let emailItems: { name: string; quantity: number; imageUrl: string | null }[] = [];
  try {
    const variantIds = Array.from(new Set(input.items.map((item) => item.variantId)));
    const variants = variantIds.length
      ? await prisma.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, name: true, imageUrl: true },
        })
      : [];
    const byId = new Map(variants.map((variant) => [variant.id, variant]));

    emailItems = input.items
      .map((item) => {
        const variant = byId.get(item.variantId);
        return variant
          ? { name: variant.name, quantity: item.quantity, imageUrl: variant.imageUrl }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  } catch (error) {
    console.error("[order-fulfillment] Kunde inte läsa varianter för mailet:", error);
  }

  // Mail skickas sist och kan aldrig kasta — ordern är redan skapad i databasen
  // och får inte rullas tillbaka för att SMTP strular.
  await sendSystemNotification({
    type: "card_order_confirmed",
    to: input.customerEmail,
    name: recipientName,
    orderId: order.id,
    quantity: order.quantity,
    amountTotal: input.amountTotal,
    currency: input.currency,
    items: emailItems,
    isGift: input.checkoutSource === "admin_gift",
  });

  if (premiumWasActivated) {
    await sendSystemNotification({
      type: "premium_activated",
      to: input.customerEmail,
      name: recipientName,
      source: "card_order",
    });
  }

  return order.id;
}
