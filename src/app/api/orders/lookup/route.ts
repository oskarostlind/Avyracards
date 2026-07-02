import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: {
      OR: [{ stripeSessionId: id }, { stripePaymentIntentId: id }],
    },
    include: {
      items: {
        include: { productVariant: { include: { product: true } } },
      },
      cards: { select: { id: true, status: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.userId) {
    const session = await auth();
    if (session?.user?.id !== order.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    createdAt: order.createdAt,
    amountTotal: order.amountTotal,
    currency: order.currency,
    checkoutSource: order.checkoutSource,
    shipping: {
      name: order.shippingName,
      line1: order.shippingLine1,
      line2: order.shippingLine2,
      city: order.shippingCity,
      postalCode: order.shippingPostalCode,
      country: order.shippingCountry,
    },
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      productName: item.productVariant.product.name,
      variantName: item.productVariant.name,
    })),
    cardCount: order.cards.length,
  });
}
